// Кеш для операцій читання за схемою cache-aside:
//   1. дивимось у кеш; якщо запис є і TTL не сплив, повертаємо його;
//   2. інакше читаємо з бази, кладемо в кеш із TTL і повертаємо.
// Кеш ніколи не повинен ламати сервіс: якщо Redis недоступний, читаємо з бази.
const config = require('./config');

// Лічильники для порівняння "без кешу / з кешем". Збираються локально в памʼяті процесу
// і раз на кілька секунд додаються до спільних лічильників у Redis (щоб не робити
// додатковий запит у Redis на кожен HTTP-запит і не спотворювати вимірювання).
const stats = { hits: 0, misses: 0, dbQueries: 0 };
const FLUSH_EVERY_MS = 5000;
const OP_TIMEOUT_MS = 250; // Redis, що не відповідає, не має гальмувати API

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('cache timeout')), OP_TIMEOUT_MS).unref()),
  ]);

// ---------- Кеш у памʼяті процесу (окремий у кожного екземпляра) ----------
function createMemoryBackend() {
  const store = new Map();
  const totals = { hits: 0, misses: 0, dbQueries: 0 };
  return {
    name: 'memory',
    async get(key) {
      const e = store.get(key);
      if (!e) return null;
      if (e.expires <= Date.now()) {
        store.delete(key);
        return null;
      }
      return e.value;
    },
    async set(key, value, ttlSeconds) {
      store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    },
    async deletePrefix(prefix) {
      for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
    },
    async flushStats() {
      for (const k of Object.keys(totals)) totals[k] += stats[k];
      stats.hits = stats.misses = stats.dbQueries = 0;
    },
    async readStats() {
      await this.flushStats();
      return { ...totals };
    },
    async close() {},
  };
}

// ---------- Спільний Redis ----------
function createRedisBackend() {
  const { createClient } = require('redis');
  const client = createClient({
    url: config.redisUrl,
    // Якщо звʼязку з Redis немає, команди одразу падають (а не стоять у черзі),
    // і ми переходимо на читання з бази.
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: (retries) => Math.min(retries * 200, 2000),
    },
  });
  let lastLog = 0;
  client.on('error', (err) => {
    if (Date.now() - lastLog > 10000) {
      lastLog = Date.now();
      console.error(`Redis: ${err.message}`);
    }
  });
  client.connect().catch(() => {}); // не блокуємо старт API, перепідключення автоматичне

  return {
    name: 'redis',
    get: (key) => withTimeout(client.get(key)),
    set: (key, value, ttlSeconds) => withTimeout(client.set(key, value, { EX: ttlSeconds })),
    async deletePrefix(prefix) {
      const keys = [];
      for await (const k of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
        keys.push(...(Array.isArray(k) ? k : [k]));
      }
      if (keys.length) await withTimeout(client.unlink(keys));
    },
    async flushStats() {
      const delta = { hits: stats.hits, misses: stats.misses, dbQueries: stats.dbQueries };
      stats.hits = stats.misses = stats.dbQueries = 0;
      const m = client.multi();
      let any = false;
      for (const [k, v] of Object.entries(delta)) {
        if (v > 0) {
          m.incrBy(`stats:${k}`, v);
          any = true;
        }
      }
      if (any) await withTimeout(m.exec());
    },
    async readStats() {
      await this.flushStats().catch(() => {});
      const [hits, misses, dbQueries] = await withTimeout(
        client.mGet(['stats:hits', 'stats:misses', 'stats:dbQueries'])
      );
      return { hits: Number(hits || 0), misses: Number(misses || 0), dbQueries: Number(dbQueries || 0) };
    },
    async close() {
      await client.quit().catch(() => {});
    },
  };
}

const backend = config.cacheBackend === 'redis' && config.redisUrl ? createRedisBackend() : createMemoryBackend();

const flushTimer = setInterval(() => backend.flushStats().catch(() => {}), FLUSH_EVERY_MS);
flushTimer.unref();

// Якщо той самий ключ уже вантажиться з бази в цьому процесі, інші запити чекають на нього
// і не йдуть у базу самі. Це захист від лавинного звернення до бази (cache stampede).
const inflight = new Map();

// Повертає { body, source }, де body це готовий JSON-рядок, а source: HIT | MISS | BYPASS.
// У кеші зберігаємо вже серіалізований JSON, щоб на влучанні не витрачати CPU на JSON.stringify.
async function getOrLoad(key, loader) {
  if (!config.cacheEnabled) {
    return { body: await loader(), source: 'BYPASS' };
  }

  let cached = null;
  try {
    cached = await backend.get(key);
  } catch (err) {
    cached = null; // кеш недоступний: працюємо без нього
  }
  if (cached !== null && cached !== undefined) {
    stats.hits++;
    return { body: cached, source: 'HIT' };
  }

  stats.misses++;
  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      const body = await loader();
      try {
        await backend.set(key, body, config.cacheTtlSeconds);
      } catch (err) {
        // не вдалося зберегти в кеш: не страшно, відповідь все одно віддаємо
      }
      return body;
    })().finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return { body: await pending, source: 'MISS' };
}

// Інвалідація: видаляємо всі закешовані списки після зміни даних.
async function invalidateLists() {
  if (!config.cacheEnabled || !config.cacheInvalidateOnWrite) return;
  try {
    await backend.deletePrefix('products:list:');
  } catch (err) {
    // якщо не вдалося, записи самі зникнуть після TTL
  }
}

async function getStats() {
  let totals = { hits: 0, misses: 0, dbQueries: 0 };
  try {
    totals = await backend.readStats();
  } catch (err) {
    // лічильники недоступні
  }
  const lookups = totals.hits + totals.misses;
  return {
    backend: backend.name,
    enabled: config.cacheEnabled,
    ttlSeconds: config.cacheTtlSeconds,
    invalidateOnWrite: config.cacheInvalidateOnWrite,
    hits: totals.hits,
    misses: totals.misses,
    hitRatio: lookups > 0 ? Number((totals.hits / lookups).toFixed(4)) : null,
    dbQueries: totals.dbQueries,
  };
}

async function close() {
  clearInterval(flushTimer);
  await backend.flushStats().catch(() => {});
  await backend.close();
}

module.exports = { getOrLoad, invalidateLists, getStats, close, stats };
