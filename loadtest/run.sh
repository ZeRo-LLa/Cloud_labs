#!/usr/bin/env bash
# Запуск навантажувального тесту однією командою (з кореня репозиторію):
#   ./loadtest/run.sh            # N = 50 користувачів
#   VUS=80 ./loadtest/run.sh     # інше N
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-$(terraform -chdir=infra output -raw app_url)}"
export BASE_URL

k6 run --summary-export=loadtest/summary.json loadtest/script.js
