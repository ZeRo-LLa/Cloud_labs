variable "region" {
  description = "Регіон AWS"
  type        = string
  default     = "eu-north-1"
}

variable "project" {
  description = "Префікс імен усіх ресурсів"
  type        = string
  default     = "f1-shop"
}

variable "alert_email" {
  description = "Email для сповіщень бюджету (задається в terraform.tfvars)"
  type        = string
}

variable "budget_limit" {
  description = "Місячний ліміт бюджету, USD"
  type        = number
  default     = 20
}

variable "image_tag" {
  description = "Тег Docker-образу в ECR, який запускає сервіс"
  type        = string
  default     = "v1"
}

variable "db_instance_class" {
  description = "Клас інстансу RDS"
  type        = string
  default     = "db.t4g.micro"
}

variable "github_repo" {
  description = "Репозиторій GitHub у форматі власник/репозиторій, якому дозволено деплой"
  type        = string
  default     = "ZeRo-LLa/Cloud_labs"
}

variable "github_branch" {
  description = "Гілка, з якої дозволено деплой"
  type        = string
  default     = "main"
}

variable "github_owner_id" {
  description = "Числовий ID власника репозиторію на GitHub (береться з поля sub токена)"
  type        = string
  default     = "176626641"
}

variable "github_repo_id" {
  description = "Числовий ID репозиторію на GitHub (береться з поля sub токена)"
  type        = string
  default     = "1453344104"
}
