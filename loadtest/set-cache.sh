#!/usr/bin/env bash
# Вмикає або вимикає кеш у запущеному сервісі без Terraform і без нового коміту:
#   ./loadtest/set-cache.sh off                 # прогін "без кешу"
#   ./loadtest/set-cache.sh on                  # прогін "з кешем" (TTL, без інвалідації)
#   ./loadtest/set-cache.sh on invalidate       # кеш + видалення списків після кожного запису
#
# Скрипт реєструє нову ревізію task definition зі зміненою змінною середовища
# і оновлює сервіс (так само, як це робить CI). Займає 2-4 хвилини.
set -euo pipefail

MODE="${1:-}"
INVALIDATE="${2:-}"
case "$MODE" in
  on) CACHE_ENABLED=true ;;
  off) CACHE_ENABLED=false ;;
  *) echo "Використання: $0 on|off [invalidate]" >&2; exit 1 ;;
esac
case "$INVALIDATE" in
  invalidate) INVALIDATE_VALUE=true ;;
  "") INVALIDATE_VALUE=false ;;
  *) echo "Другий аргумент може бути лише: invalidate" >&2; exit 1 ;;
esac

REGION="${AWS_REGION:-eu-north-1}"
CLUSTER="${ECS_CLUSTER:-f1-shop-cluster}"
SERVICE="${ECS_SERVICE:-f1-shop-api}"
FAMILY="${ECS_TASK_FAMILY:-f1-shop-api}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

aws ecs describe-task-definition --task-definition "$FAMILY" --region "$REGION" --query taskDefinition > "$TMP/taskdef.json"

jq --arg enabled "$CACHE_ENABLED" --arg invalidate "$INVALIDATE_VALUE" '
  .containerDefinitions[0].environment |=
    (map(select(.name != "CACHE_ENABLED" and .name != "CACHE_INVALIDATE_ON_WRITE"))
     + [{name: "CACHE_ENABLED", value: $enabled}, {name: "CACHE_INVALIDATE_ON_WRITE", value: $invalidate}])
  | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
' "$TMP/taskdef.json" > "$TMP/new-taskdef.json"

NEW="$(aws ecs register-task-definition --region "$REGION" --cli-input-json "file://$TMP/new-taskdef.json" --query taskDefinition.taskDefinitionArn --output text)"
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service "$SERVICE" --task-definition "$NEW" > /dev/null
echo "Чекаю, поки сервіс стабілізується..."
aws ecs wait services-stable --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE"
echo "Готово: CACHE_ENABLED=$CACHE_ENABLED, CACHE_INVALIDATE_ON_WRITE=$INVALIDATE_VALUE ($NEW)"
