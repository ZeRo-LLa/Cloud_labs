const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// База може стартувати трохи пізніше за застосунок, тому пробуємо кілька разів.
async function waitForDb(retries = 20, delayMs = 1500) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`Чекаю на базу (${i}/${retries}): ${err.message}`);
      await sleep(delayMs);
    }
  }
  throw new Error('Не вдалося підключитися до бази даних');
}

// Створює таблицю і, якщо вона порожня, заповнює початковими даними.
// Скрипт безпечно запускати багато разів.
async function init() {
  await waitForDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products');
  if (rows[0].n === 0) {
    const seed = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8')
    );
    for (const p of seed) {
      await pool.query(
        'INSERT INTO products (name, engine, price, description, image) VALUES ($1,$2,$3,$4,$5)',
        [p.name, p.engine, p.price, p.description, p.image]
      );
    }
    console.log(`Додано ${seed.length} початкових записів`);
  }
}

module.exports = { pool, init };
