resource "aws_security_group" "alb" {
  name        = "${var.project}-alb-sg"
  description = "ALB: HTTP from the internet"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project}-alb-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTP from the internet"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb.id
  description                  = "Traffic to the application"
  referenced_security_group_id = aws_security_group.app.id
  from_port                    = 5005
  to_port                      = 5005
  ip_protocol                  = "tcp"
}

# --- Застосунок: порт 5005 лише від балансувальника ---
resource "aws_security_group" "app" {
  name        = "${var.project}-app-sg"
  description = "Application container"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project}-app-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "Application port from ALB only"
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 5005
  to_port                      = 5005
  ip_protocol                  = "tcp"
}

# Вихідний трафік потрібен для ECR, CloudWatch, Secrets Manager і бази
resource "aws_vpc_security_group_egress_rule" "app_all_out" {
  security_group_id = aws_security_group.app.id
  description       = "All outbound traffic"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# --- База: PostgreSQL лише від security group застосунку ---
resource "aws_security_group" "db" {
  name        = "${var.project}-db-sg"
  description = "PostgreSQL from the application only"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project}-db-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "PostgreSQL from the application"
  referenced_security_group_id = aws_security_group.app.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}
