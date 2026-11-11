// Уся конфігурація береться зі змінних середовища.
// Паролі та рядки підключення в код не пишемо.
const config = {
  port: Number(process.env.PORT) || 5005,
  databaseUrl: process.env.DATABASE_URL,
  // у керованих базах хмари (RDS, Cloud SQL) зазвичай потрібен SSL
  dbSsl: process.env.DB_SSL === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

if (!config.databaseUrl) {
  console.error('DATABASE_URL не задано. Приклад: postgres://user:pass@localhost:5432/f1');
  process.exit(1);
}

module.exports = config;
