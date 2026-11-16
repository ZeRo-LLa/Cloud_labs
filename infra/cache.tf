# Спільний кеш Redis (лабораторна 2, завдання 5).
# Redis стоїть у приватних підмережах поруч із базою; порт 6379 відкритий лише для security group застосунку.

variable "cache_node_type" {
  description = "Клас вузла ElastiCache"
  type        = string
  default     = "cache.t4g.micro"
}

variable "cache_ttl_seconds" {
  description = "TTL записів у кеші, секунди"
  type        = number
  default     = 30
}

variable "cache_invalidate_on_write" {
  description = "Видаляти кеш списків одразу після запису (false: дані можуть бути застарілими до кінця TTL)"
  type        = bool
  default     = false
}

resource "aws_security_group" "cache" {
  name        = "${var.project}-cache-sg"
  description = "Redis from the application only"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project}-cache-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "cache_from_app" {
  security_group_id            = aws_security_group.cache.id
  description                  = "Redis from the application"
  referenced_security_group_id = aws_security_group.app.id
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
}

resource "aws_elasticache_subnet_group" "cache" {
  name       = "${var.project}-cache-subnets"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "cache" {
  cluster_id           = "${var.project}-cache"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.cache_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.cache.name
  security_group_ids = [aws_security_group.cache.id]

  apply_immediately = true
}

output "cache_endpoint" {
  description = "Адреса Redis (доступна лише зсередини VPC)"
  value       = aws_elasticache_cluster.cache.cache_nodes[0].address
}
