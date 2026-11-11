CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        TEXT           NOT NULL,
  engine      TEXT           NOT NULL,
  price       NUMERIC(14, 0) NOT NULL CHECK (price >= 0),
  description TEXT           NOT NULL DEFAULT '',
  image       TEXT           NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_products_engine ON products (engine);
