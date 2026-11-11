# F1 API

REST API для магазину болідів Формули 1. Express + PostgreSQL.

## Ендпоінти

| Метод | URL | Опис |
|---|---|---|
| GET | `/health` | перевірка, що застосунок і база працюють |
| GET | `/products` | список болідів, фільтр `?engine=Mercedes` |
| GET | `/products/:id` | один болід |
| POST | `/products` | створити (`name`, `engine`, `price` обовʼязкові) |
| PUT | `/products/:id` | повна заміна |
| PATCH | `/products/:id` | часткове оновлення |
| DELETE | `/products/:id` | видалити |

## Запуск через Docker (рекомендовано)

```bash
cp .env.example .env        # відкрий .env і задай свій пароль
docker compose up --build
```

API буде на http://localhost:5005. Таблиця створюється і заповнюється 11 болідами автоматично при першому старті.

Зупинка:
```bash
docker compose down         # дані лишаються у volume
docker compose down -v      # дані видаляються
```

## Запуск без Docker

Потрібні Node 20+ і PostgreSQL.

```bash
npm install
export DATABASE_URL=postgres://user:password@localhost:5432/f1
npm start
```

## Змінні середовища

| Змінна | За замовчуванням | Опис |
|---|---|---|
| `DATABASE_URL` | немає (обовʼязкова) | рядок підключення до PostgreSQL |
| `PORT` | 5005 | порт застосунку |
| `DB_SSL` | false | `true`, якщо керована база вимагає SSL |
| `CORS_ORIGIN` | `*` | дозволений origin фронтенду |

## Як перевірити, що все працює

```bash
curl localhost:5005/health
curl localhost:5005/products
curl "localhost:5005/products?engine=Mercedes"
curl localhost:5005/products/2

curl -X POST localhost:5005/products -H "Content-Type: application/json" \
  -d '{"name":"Test","engine":"X","price":100}'

curl -X PATCH localhost:5005/products/12 -H "Content-Type: application/json" \
  -d '{"price":555}'

curl -X DELETE localhost:5005/products/12
```

Перевірка, що дані переживають перезапуск:
```bash
curl -X POST localhost:5005/products -H "Content-Type: application/json" \
  -d '{"name":"Persist","engine":"X","price":1}'
docker compose down
docker compose up
curl localhost:5005/products     # запис "Persist" має бути на місці
```

Подивитися дані прямо в базі:
```bash
docker compose exec db psql -U f1 -d f1 -c "SELECT * FROM products;"
```

## Структура

```
src/server.js     запуск, middleware, обробка помилок
src/routes.js     ендпоінти і валідація
src/db.js         підключення, створення таблиці, початкові дані
src/schema.sql    схема таблиці products
src/config.js     змінні середовища
data/products.json початкові дані
Dockerfile        образ застосунку
compose.yaml      застосунок + PostgreSQL з volume
```
