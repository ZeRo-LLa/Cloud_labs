output "app_url" {
  description = "Публічна адреса застосунку"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "Адреса реєстру образів"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.app.name
}

output "db_endpoint" {
  description = "Адреса бази (доступна лише зсередини VPC)"
  value       = aws_db_instance.main.address
}
