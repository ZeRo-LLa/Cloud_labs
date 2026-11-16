// Уся конфігурація береться зі змінних середовища.
// Паролі та рядки підключення в код не пишемо.
const config = {
  port: Number(process.env.PORT) || 5005,
  databaseUrl: process.env.DATABASE_URL,
  // у керованих базах хмари (RDS, Cloud SQL) зазвичай потрібен SSL
  dbSsl: process.env.DB_SSL === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // --- Кеш (лабораторна 2, завдання 5) ---
  // CACHE_ENABLED=true вмикає схему cache-aside для списків болідів.
  cacheEnabled: process.env.CACHE_ENABLED === 'true',
  // redis: спільний Redis (REDIS_URL); memory: кеш у памʼяті процесу (окремий у кожного екземпляра)
  redisUrl: process.env.REDIS_URL || '',
  cacheBackend: process.env.CACHE_BACKEND || (process.env.REDIS_URL ? 'redis' : 'memory'),
  // скільки секунд запис живе в кеші (TTL)
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 30,
  // true: після POST/PUT/PATCH/DELETE кеш списків видаляється одразу;
  // false: дані можуть бути застарілими до закінчення TTL
  cacheInvalidateOnWrite: process.env.CACHE_INVALIDATE_ON_WRITE === 'true',
};

if (!config.databaseUrl) {
  console.error('DATABASE_URL не задано. Приклад: postgres://user:pass@localhost:5432/f1');
  process.exit(1);
}

module.exports = config;
