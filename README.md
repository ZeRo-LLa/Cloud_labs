# F1 Cars Shop

Магазин болідів Формули 1: React-фронтенд і власний REST API на Node.js (Express) з базою PostgreSQL.
Бекенд запакований у Docker і розгорнутий в AWS за допомогою Terraform.

## Публічна адреса

http://f1-shop-alb-816572861.eu-north-1.elb.amazonaws.com

- `GET /health` — стан застосунку і бази
- `GET /products` — список болідів

> Ресурси в AWS видаляються після захисту (`terraform destroy`), тому адреса може бути недоступною.

## Структура проєкту

```
.
├── f1-api-new/      REST API (Express + PostgreSQL), Dockerfile, compose.yaml
├── f1-cars-shop/    фронтенд на React
├── infra/           Terraform: VPC, RDS, ECR, ECS Fargate, ALB, автомасштабування, моніторинг, Redis
├── loadtest/        навантажувальний тест k6 і скрипти запуску
├── docs/            документи лабораторної 2 (масштабування, тест, сповіщення, кеш)
└── README.md
```

## Архітектура в AWS

```
Інтернет → ALB (порт 80) → ECS Fargate (контейнер, порт 5005) → RDS PostgreSQL (приватна підмережа)
```

- Тільки балансувальник відкритий в інтернет. Контейнер приймає трафік лише від ALB.
- База даних у приватних підмережах без публічної адреси. Security group бази пускає порт 5432 лише від security group застосунку.
- Рядок підключення до бази зберігається в AWS Secrets Manager і потрапляє в контейнер як змінна середовища `DATABASE_URL`.
- Health check балансувальника перевіряє `GET /health`.
- Читання списку болідів кешується в Redis (ElastiCache) у приватних підмережах за схемою cache-aside, докладніше в `docs/CACHE.md`.
- Усі ресурси описані в Terraform.

## API

| Метод | URL | Опис |
|---|---|---|
| GET | `/health` | перевірка застосунку і бази |
| GET | `/products` | список болідів, фільтр `?engine=Mercedes` |
| GET | `/products/:id` | один болід |
| POST | `/products` | створити |
| PUT | `/products/:id` | повна заміна |
| PATCH | `/products/:id` | часткове оновлення |
| DELETE | `/products/:id` | видалити |
| GET | `/cache/stats` | лічильники кешу |

## Локальний запуск (Docker)

```bash
cd f1-api-new
cp .env.example .env     # задай пароль до бази
docker compose up --build
```

API: http://localhost:5005. Дані бази зберігаються у volume і переживають `docker compose down`.

Фронтенд:

```bash
cd f1-cars-shop
npm install
npm start
```

Адресу API можна змінити змінною `REACT_APP_API_URL`.

## Розгортання в AWS

Потрібні: AWS CLI з налаштованим доступом, Terraform, Docker.

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # впиши email для сповіщень бюджету
terraform init

# 1. реєстр образів
terraform apply -target=aws_ecr_repository.app

# 2. збірка і пуш образу
REPO=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin ${REPO%%/*}
docker build --platform linux/amd64 -t $REPO:v1 ../f1-api-new
docker push $REPO:v1

# 3. решта інфраструктури
terraform apply
terraform output app_url
```

Видалення всього:

```bash
terraform destroy
```
