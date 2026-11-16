# Сповіщення на email (лабораторна 2, завдання 4):
# лист при CPU > 70% протягом 2 хвилин і другий лист при поверненні до норми.

variable "alarm_cpu_threshold" {
  description = "Поріг CPU для сповіщення, %"
  type        = number
  default     = 70
}

# Канал доставки: SNS-тема з підпискою на email.
# Після apply на пошту прийде лист "AWS Notification - Subscription Confirmation":
# треба натиснути Confirm subscription, інакше листи доставлятися не будуть.
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Правило: середнє CPU по сервісу > 70% у 2 хвилинних періодах підряд.
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name        = "${var.project}-cpu-high"
  alarm_description = "CPU сервісу вище ${var.alarm_cpu_threshold}% протягом 2 хвилин"

  namespace   = "AWS/ECS"
  metric_name = "CPUUtilization"
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  statistic           = "Average"
  period              = 60
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  threshold           = var.alarm_cpu_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn] # перехід у тривогу: перший лист
  ok_actions    = [aws_sns_topic.alerts.arn] # повернення до норми: другий лист
}

output "dashboard_url" {
  description = "Панель моніторингу в консолі AWS"
  value       = "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
