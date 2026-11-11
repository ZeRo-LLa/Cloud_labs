# Інфраструктура (Terraform, AWS)

Створює: VPC з публічними та приватними підмережами, ECR, RDS PostgreSQL (приватна),
ECS Fargate, Application Load Balancer, секрет із рядком підключення, бюджет.

## Перший запуск

```bash
cp terraform.tfvars.example terraform.tfvars   # впиши свій email
terraform init

# 1. Спочатку лише реєстр образів
terraform apply -target=aws_ecr_repository.app

# 2. Збірка і пуш образу (шлях до папки з Dockerfile підстав свій)
REPO=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin ${REPO%%/*}
docker build --platform linux/amd64 -t $REPO:v1 ../f1-api-new
docker push $REPO:v1

# 3. Решта інфраструктури (база створюється 5-10 хвилин)
terraform apply
```

Адреса застосунку: `terraform output app_url`

## Прибрати все

```bash
terraform destroy
```
