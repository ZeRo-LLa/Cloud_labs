# Автоматичне горизонтальне масштабування ECS-сервісу (лабораторна 2, завдання 1).
# Application Auto Scaling стежить за метрикою і сам змінює desired_count сервісу.

variable "autoscaling_min" {
  description = "Мінімальна кількість екземплярів (задач)"
  type        = number
  default     = 1
}

variable "autoscaling_max" {
  description = "Максимальна кількість екземплярів (за умовою лаби не більше 4)"
  type        = number
  default     = 3

  validation {
    condition     = var.autoscaling_max >= 1 && var.autoscaling_max <= 4
    error_message = "За умовою лабораторної максимум не може перевищувати 4."
  }
}

variable "autoscaling_cpu_target" {
  description = "Цільове середнє завантаження CPU по сервісу, %"
  type        = number
  default     = 60
}

variable "scale_out_cooldown" {
  description = "Період стабілізації після додавання екземпляра, секунди"
  type        = number
  default     = 60
}

variable "scale_in_cooldown" {
  description = "Період стабілізації після вилучення екземпляра, секунди"
  type        = number
  default     = 300
}

# Що саме масштабуємо: desired_count сервісу ECS
resource "aws_appautoscaling_target" "ecs" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"

  min_capacity = var.autoscaling_min
  max_capacity = var.autoscaling_max
}

# Як масштабуємо: target tracking. Ми задаємо ціль (CPU ~60%),
# AWS сам створює alarm-и CloudWatch і вирішує, скільки екземплярів додати чи прибрати.
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project}-cpu-target-tracking"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  resource_id        = aws_appautoscaling_target.ecs.resource_id

  target_tracking_scaling_policy_configuration {
    target_value = var.autoscaling_cpu_target

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    scale_out_cooldown = var.scale_out_cooldown
    scale_in_cooldown  = var.scale_in_cooldown
  }
}
