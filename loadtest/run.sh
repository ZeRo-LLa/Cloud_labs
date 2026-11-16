#!/usr/bin/env bash
# Запуск навантажувального тесту однією командою (з кореня репозиторію):
#   ./loadtest/run.sh            # N = 50 користувачів
#   VUS=80 ./loadtest/run.sh     # інше N
#
# Для порівняння "без кешу / з кешем" дай прогону мітку, і результати збережуться окремо:
#   LABEL=nocache ./loadtest/run.sh    # loadtest/summary-nocache.json + cache-stats-nocache.json
#   LABEL=cache   ./loadtest/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-$(terraform -chdir=infra output -raw app_url)}"
export BASE_URL

SUFFIX="${LABEL:+-$LABEL}"
SUMMARY="loadtest/summary${SUFFIX}.json"
STATS_OUT="loadtest/cache-stats${SUFFIX}.json"

# Лічильники кешу накопичувальні, тому беремо їх до і після тесту й рахуємо різницю.
# Екземпляри зливають свої лічильники в Redis раз на 5 секунд, тож трохи чекаємо.
get_stats() { curl -sf -m 10 "$BASE_URL/cache/stats" || echo ""; }
sleep 6
BEFORE="$(get_stats)"

K6_EXIT=0
k6 run --summary-export="$SUMMARY" loadtest/script.js || K6_EXIT=$?

sleep 7
AFTER="$(get_stats)"

if [ -n "$BEFORE" ] && [ -n "$AFTER" ]; then
  BEFORE="$BEFORE" AFTER="$AFTER" node -e '
    const b = JSON.parse(process.env.BEFORE), a = JSON.parse(process.env.AFTER);
    const hits = a.hits - b.hits, misses = a.misses - b.misses, dbQueries = a.dbQueries - b.dbQueries;
    const out = {
      backend: a.backend, cacheEnabled: a.enabled, ttlSeconds: a.ttlSeconds, invalidateOnWrite: a.invalidateOnWrite,
      hits, misses, hitRatio: hits + misses > 0 ? Number((hits / (hits + misses)).toFixed(4)) : null, dbQueries,
    };
    require("fs").writeFileSync(process.argv[1], JSON.stringify(out, null, 2) + "\n");
    console.log("\nКеш за час тесту:", JSON.stringify(out));
  ' "$STATS_OUT"
else
  echo "Не вдалося прочитати /cache/stats (старий деплой без кешу?), пропускаю підсумок кешу." >&2
fi

exit "$K6_EXIT"
