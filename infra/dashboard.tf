# Панель моніторингу (лабораторна 2, завдання 3): 5 графіків у CloudWatch.

locals {
  lb_dim = aws_lb.main.arn_suffix
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # 1. Кількість екземплярів: бажана (DesiredTaskCount) і фактична (RunningTaskCount)
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6
        properties = {
          title  = "1. Екземпляри: бажана і фактична кількість"
          region = var.region
          view   = "timeSeries"
          stat   = "Average"
          period = 60
          metrics = [
            ["ECS/ContainerInsights", "DesiredTaskCount", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name, { label = "Бажана (desired)" }],
            ["ECS/ContainerInsights", "RunningTaskCount", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name, { label = "Фактична (running)" }],
          ]
          yAxis = { left = { min = 0 } }
        }
      },
      # 2. Завантаження процесора з лініями цілі масштабування і порогу алерта
      {
        type = "metric", x = 12, y = 0, width = 12, height = 6
        properties = {
          title  = "2. Завантаження CPU, %"
          region = var.region
          view   = "timeSeries"
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name, { label = "CPU, середнє по сервісу" }],
          ]
          annotations = {
            horizontal = [
              { label = "Ціль масштабування", value = var.autoscaling_cpu_target },
              { label = "Поріг алерта", value = var.alarm_cpu_threshold },
            ]
          }
          yAxis = { left = { min = 0, max = 100 } }
        }
      },
      # 3. Кількість запитів за хвилину
      {
        type = "metric", x = 0, y = 6, width = 12, height = 6
        properties = {
          title  = "3. Запити за хвилину"
          region = var.region
          view   = "timeSeries"
          stat   = "Sum"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", local.lb_dim, { label = "Запити/хв" }],
          ]
          yAxis = { left = { min = 0 } }
        }
      },
      # 4. Латентність p95 (в секундах)
      {
        type = "metric", x = 12, y = 6, width = 12, height = 6
        properties = {
          title  = "4. Латентність p95, секунди"
          region = var.region
          view   = "timeSeries"
          stat   = "p95"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", local.lb_dim, { label = "p95" }],
          ]
          yAxis = { left = { min = 0 } }
        }
      },
      # 5. Відповіді 5xx: від застосунку і від самого балансувальника
      {
        type = "metric", x = 0, y = 12, width = 12, height = 6
        properties = {
          title  = "5. Відповіді 5xx"
          region = var.region
          view   = "timeSeries"
          stat   = "Sum"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", local.lb_dim, { label = "5xx від застосунку" }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", local.lb_dim, { label = "5xx від ALB" }],
          ]
          yAxis = { left = { min = 0 } }
        }
      },
    ]
  })
}
