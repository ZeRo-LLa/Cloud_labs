resource "aws_ecr_repository" "app" {
  name                 = "${var.project}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # щоб terraform destroy працював, навіть якщо в реєстрі є образи

  image_scanning_configuration {
    scan_on_push = true
  }
}
