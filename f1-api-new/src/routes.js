const express = require('express');
const { pool } = require('./db');

const router = express.Router();

// Формат відповіді такий самий, як був у json-server: id — рядок, price — число.
const toDto = (r) => ({
  id: String(r.id),
  name: r.name,
  engine: r.engine,
  price: Number(r.price),
  description: r.description,
  image: r.image,
});

function validate(body, { partial = false } = {}) {
  const errors = [];
  const b = body || {};
  const isStr = (v) => typeof v === 'string' && v.trim() !== '';

  if (!partial || b.name !== undefined) if (!isStr(b.name)) errors.push('name: обовʼязковий рядок');
  if (!partial || b.engine !== undefined) if (!Number.isInteger(b.engine)) errors.push('engine: число');
  if (!partial || b.price !== undefined)
    if (typeof b.price !== 'number' || !Number.isFinite(b.price) || b.price < 0)
      errors.push('price: невідʼємне число');
  if (b.description !== undefined && typeof b.description !== 'string') errors.push('description: рядок');
  if (b.image !== undefined && typeof b.image !== 'string') errors.push('image: рядок');
  return errors;
}

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'id має бути додатним цілим числом' });
    return null;
  }
  return id;
};

// Health check: перевіряє, що застосунок живий і база відповідає.
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'up', version: process.env.GIT_SHA || 'dev' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

// GET /products?engine=Mercedes
router.get('/products', async (req, res, next) => {
  try {
    const { engine } = req.query;
    const { rows } = engine
      ? await pool.query('SELECT * FROM products WHERE engine = $1 ORDER BY id', [engine])
      : await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows.map(toDto));
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Продукт не знайдено' });
    res.json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { name, engine, price, description = '', image = '' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO products (name, engine, price, description, image)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, engine, price, description, image]
    );
    res.status(201).json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PUT — повна заміна, PATCH — часткове оновлення
async function update(req, res, next, partial) {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const errors = validate(req.body, { partial });
    if (errors.length) return res.status(400).json({ errors });

    const cur = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Продукт не знайдено' });

    const b = req.body;
    const old = cur.rows[0];
    const next_ = {
      name: b.name ?? old.name,
      engine: b.engine ?? old.engine,
      price: b.price ?? old.price,
      description: b.description ?? (partial ? old.description : ''),
      image: b.image ?? (partial ? old.image : ''),
    };
    const { rows } = await pool.query(
      `UPDATE products SET name=$1, engine=$2, price=$3, description=$4, image=$5
       WHERE id=$6 RETURNING *`,
      [next_.name, next_.engine, next_.price, next_.description, next_.image, id]
    );
    res.json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
}
router.put('/products/:id', (req, res, next) => update(req, res, next, false));
router.patch('/products/:id', (req, res, next) => update(req, res, next, true));

router.delete('/products/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Продукт не знайдено' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
