#!/bin/bash
# Run integration tests with ephemeral test services
#
# This script handles all setup and teardown automatically:
# 1. Starts test services (PostgreSQL, Qdrant)
# 2. Runs integration tests
# 3. Tears down all services on exit (even on failure)
#
# Usage: ./tests/scripts/test-integration.sh [pytest args]
# Example: ./tests/scripts/test-integration.sh -v -k "test_service_info"
#
# For manual service control (debugging):
#   ./tests/scripts/services.sh start
#   RUN_INTEGRATION_TESTS=true pytest tests/integration/
#   ./tests/scripts/services.sh stop

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."
SERVICES_SCRIPT="$SCRIPT_DIR/services.sh"

# Generate unique run ID for this test session (enables parallel test runs)
export BEDHOST_TEST_RUN_ID="$$"

# Pre-compute ports so cleanup still has them even if services.sh never ran
export BEDHOST_TEST_DB_PORT=$(( 5433 + (RANDOM % 1000) ))
export BEDHOST_TEST_QDRANT_PORT=$(( 6334 + (RANDOM % 1000) ))
export BEDHOST_TEST_PG_CONTAINER="bedhost-postgres-test-${BEDHOST_TEST_RUN_ID}"
export BEDHOST_TEST_QDRANT_CONTAINER="bedhost-qdrant-test-${BEDHOST_TEST_RUN_ID}"

SERVICES_STARTED=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Cleanup function - runs on exit (success or failure)
cleanup() {
    local exit_code=$?
    echo ""
    if [ "$SERVICES_STARTED" = true ]; then
        log_info "Cleaning up..."
        "$SERVICES_SCRIPT" stop
    fi

    if [ $exit_code -eq 0 ]; then
        log_info "Integration tests completed successfully!"
    else
        log_error "Integration tests failed with exit code: $exit_code"
    fi

    exit $exit_code
}

trap cleanup EXIT INT TERM

echo "=============================================="
echo "   Bedhost Integration Tests"
echo "   Run ID: $BEDHOST_TEST_RUN_ID"
echo "=============================================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running"
    exit 1
fi

# Start services
log_info "Starting test services..."
"$SERVICES_SCRIPT" start
SERVICES_STARTED=true

# Export environment variables for tests
export RUN_INTEGRATION_TESTS=true
export TEST_DB_URL="postgresql+psycopg://testuser:testpass@localhost:${BEDHOST_TEST_DB_PORT}/bedbase_test"
export TEST_QDRANT_URL="http://localhost:${BEDHOST_TEST_QDRANT_PORT}"
export BEDHOST_INIT_ML=false

# Run integration tests
echo ""
log_info "Running integration tests..."
echo "----------------------------------------------"

cd "$PROJECT_ROOT"

python3 -m pytest tests/integration/ "$@"
TEST_EXIT_CODE=$?

echo "----------------------------------------------"
exit $TEST_EXIT_CODE
