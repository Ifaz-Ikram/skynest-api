#!/bin/bash
# Setup test database for running tests

echo "🔧 Setting up test database..."

# Use the same database but ensure it's properly configured
export PGDATABASE=${PGDATABASE:-skynest}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-200320701070}
export PGHOST=${PGHOST:-localhost}
export PGPORT=${PGPORT:-5432}

echo "✅ Test database environment configured"
echo "   Database: $PGDATABASE"
echo "   User: $PGUSER"
echo "   Host: $PGHOST:$PGPORT"

# Optionally verify connection
if command -v docker &> /dev/null; then
  docker exec -i skynest-api-db-1 psql -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" &> /dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Database connection verified"
  else
    echo "⚠️  Warning: Could not verify database connection"
  fi
fi
