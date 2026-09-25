#!/bin/bash
# Smoke-test a built bedhost image before it is pushed or deployed.
#
# Checks the things the ECS task definitions rely on: the image runs as UID
# 10001, serves on port 8000, has writable cache/temp dirs, keeps the app code
# read-only, and the app module imports. No database is needed.
#
# Usage: ./tests/scripts/container-smoke.sh <image>

set -euo pipefail

IMAGE="${1:?usage: $0 <image>}"
FAILED=0

check() {
    local name="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "PASS  $name"
    else
        echo "FAIL  $name"
        FAILED=1
    fi
}

run() { docker run --rm --entrypoint "$1" "$IMAGE" "${@:2}"; }

check "runs as UID 10001" test "$(run id -u)" = "10001"
check "CMD serves on port 8000" \
    sh -c "docker inspect -f '{{json .Config.Cmd}}' '$IMAGE' | grep -q '\"8000\"'"
check "cache and temp dirs are writable" run sh -c \
    'mkdir -p "$HF_HOME" "$FASTEMBED_CACHE_PATH" "$NUMBA_CACHE_DIR" && touch "$HF_HOME/w" "$FASTEMBED_CACHE_PATH/w" "$NUMBA_CACHE_DIR/w" /tmp/w'
check "app code is read-only" run sh -c '! touch /app/bedhost/w'
check "app module imports" run python -c "import bedhost.main"

exit $FAILED
