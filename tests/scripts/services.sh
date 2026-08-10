#!/bin/bash
# Test Services Management Script
# Manages services required for integration tests (PostgreSQL, Qdrant)
#
# Supports parallel test runs via unique container names and ports.
# Set BEDHOST_TEST_RUN_ID to share services across script invocations.
#
# Usage:
#   ./tests/scripts/services.sh start   # Start all services
#   ./tests/scripts/services.sh stop    # Stop all services
#   ./tests/scripts/services.sh status  # Show service status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# Generate unique run ID if not provided (enables parallel test runs)
RUN_ID="${BEDHOST_TEST_RUN_ID:-$$}"

# Use environment variables or generate unique values
CONTAINER_NAME="${BEDHOST_TEST_PG_CONTAINER:-bedhost-postgres-test-${RUN_ID}}"
DB_PORT="${BEDHOST_TEST_DB_PORT:-$(( 5433 + (RANDOM % 1000) ))}"
QDRANT_CONTAINER="${BEDHOST_TEST_QDRANT_CONTAINER:-bedhost-qdrant-test-${RUN_ID}}"
QDRANT_PORT="${BEDHOST_TEST_QDRANT_PORT:-$(( 6334 + (RANDOM % 1000) ))}"

DB_USER="testuser"
DB_PASS="testpass"
DB_NAME="bedbase_test"

# Export for child processes and test-integration.sh
export BEDHOST_TEST_RUN_ID="$RUN_ID"
export BEDHOST_TEST_PG_CONTAINER="$CONTAINER_NAME"
export BEDHOST_TEST_DB_PORT="$DB_PORT"
export BEDHOST_TEST_QDRANT_CONTAINER="$QDRANT_CONTAINER"
export BEDHOST_TEST_QDRANT_PORT="$QDRANT_PORT"

start_postgres() {
    echo "Starting PostgreSQL..."
    echo "  Container: $CONTAINER_NAME"
    echo "  Port: $DB_PORT"

    # Remove existing container if it exists
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

    # Start PostgreSQL container with tmpfs for speed
    docker run -d \
        --name "$CONTAINER_NAME" \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD="$DB_PASS" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "${DB_PORT}:5432" \
        --tmpfs /var/lib/postgresql/data \
        postgres:17

    # Wait for healthy status (up to 30 seconds)
    echo "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" 2>/dev/null; then
            echo "PostgreSQL is ready!"
            return 0
        fi
        sleep 1
    done

    echo "Failed to start PostgreSQL"
    docker logs "$CONTAINER_NAME"
    return 1
}

stop_postgres() {
    echo "Stopping PostgreSQL ($CONTAINER_NAME)..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}

start_qdrant() {
    echo "Starting Qdrant..."
    echo "  Container: $QDRANT_CONTAINER"
    echo "  Port: $QDRANT_PORT"

    # Remove existing container if it exists
    docker rm -f "$QDRANT_CONTAINER" 2>/dev/null || true

    docker run -d \
        --name "$QDRANT_CONTAINER" \
        -p "${QDRANT_PORT}:6333" \
        --tmpfs /qdrant/storage \
        qdrant/qdrant:latest

    echo "Waiting for Qdrant to be ready..."
    for i in {1..30}; do
        if curl -sf "http://localhost:${QDRANT_PORT}/readyz" >/dev/null 2>&1; then
            echo "Qdrant is ready!"
            return 0
        fi
        sleep 1
    done

    echo "Failed to start Qdrant"
    docker logs "$QDRANT_CONTAINER"
    return 1
}

stop_qdrant() {
    echo "Stopping Qdrant ($QDRANT_CONTAINER)..."
    docker rm -f "$QDRANT_CONTAINER" 2>/dev/null || true
}

show_status() {
    echo "=== Test Services Status (Run ID: $RUN_ID) ==="
    echo ""
    echo "PostgreSQL:"
    if docker ps -f "name=$CONTAINER_NAME" --format "  Container: {{.Names}} | Port: {{.Ports}} | Status: {{.Status}}" | grep -q .; then
        docker ps -f "name=$CONTAINER_NAME" --format "  Container: {{.Names}} | Port: {{.Ports}} | Status: {{.Status}}"
    else
        echo "  Not running"
    fi
    echo ""
    echo "Qdrant:"
    if docker ps -f "name=$QDRANT_CONTAINER" --format "  Container: {{.Names}} | Port: {{.Ports}} | Status: {{.Status}}" | grep -q .; then
        docker ps -f "name=$QDRANT_CONTAINER" --format "  Container: {{.Names}} | Port: {{.Ports}} | Status: {{.Status}}"
    else
        echo "  Not running"
    fi
}

print_exports() {
    # Print export commands for manual use
    echo ""
    echo "To use these services manually, run:"
    echo "  export BEDHOST_TEST_RUN_ID=\"$RUN_ID\""
    echo "  export BEDHOST_TEST_DB_PORT=\"$DB_PORT\""
    echo "  export BEDHOST_TEST_QDRANT_PORT=\"$QDRANT_PORT\""
    echo "  export TEST_DB_URL=\"postgresql+psycopg://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}\""
    echo "  export TEST_QDRANT_URL=\"http://localhost:${QDRANT_PORT}\""
}

case "$1" in
    start)
        echo "=== Starting Test Services (Run ID: $RUN_ID) ==="
        start_postgres
        start_qdrant
        print_exports
        echo ""
        echo "=== All services started ==="
        ;;
    stop)
        echo "=== Stopping Test Services ==="
        stop_qdrant
        stop_postgres
        echo "=== All services stopped ==="
        ;;
    restart)
        $0 stop
        $0 start
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Manages services required for integration tests."
        echo ""
        echo "Environment variables for parallel execution:"
        echo "  BEDHOST_TEST_RUN_ID          - Unique identifier (default: PID)"
        echo "  BEDHOST_TEST_DB_PORT         - PostgreSQL port (default: 5433 + random)"
        echo "  BEDHOST_TEST_QDRANT_PORT     - Qdrant port (default: 6334 + random)"
        echo "  BEDHOST_TEST_PG_CONTAINER    - Postgres container name (default: bedhost-postgres-test-\$RUN_ID)"
        echo "  BEDHOST_TEST_QDRANT_CONTAINER - Qdrant container name (default: bedhost-qdrant-test-\$RUN_ID)"
        exit 1
        ;;
esac
