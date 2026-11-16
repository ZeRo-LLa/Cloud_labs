const express = require('express');
const cors = require('cors');
const config = require('./config');
const { pool, init } = require('./db');
const routes = require('./routes');
const cache = require('./cache');

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(routes);

app.use((req, res) => res.status(404).json({ error: 'Маршрут не знайдено' }));

// Некоректний JSON і несподівані помилки не повинні валити процес.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

async function main() {
  await init();
  const server = app.listen(config.port, () =>
    console.log(`API слухає порт ${config.port}`)
  );

  // Коректне завершення, щоб контейнер зупинявся без обривів запитів
  const shutdown = () => {
    console.log('Зупинка...');
    server.close(async () => {
      await cache.close();
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
