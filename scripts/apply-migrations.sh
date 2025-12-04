#!/bin/bash

# Tribr Database Migration Script
# This script applies all SQL migrations in the correct order

set -e  # Exit on error

echo "🚀 Starting Tribr database migrations..."

# Check if DIRECT_URL is set
if [ -z "$DIRECT_URL" ]; then
  echo "❌ Error: DIRECT_URL environment variable is not set"
  echo "Please set it in your .env file or export it:"
  echo "export DIRECT_URL='your_database_url'"
  exit 1
fi

# Extract database connection details from DIRECT_URL
DB_URL=$DIRECT_URL

# Array of migration files in execution order
MIGRATIONS=(
  "00_enable_postgis.sql"
  "01_add_constraints.sql"
  "02_triggers.sql"
  "03_enable_realtime.sql"
  "04_row_level_security.sql"
  "05_migrate_user_data.sql"
)

MIGRATION_DIR="prisma/migrations"

echo ""
echo "📋 Migration plan:"
for migration in "${MIGRATIONS[@]}"; do
  echo "  ✓ $migration"
done
echo ""

read -p "Continue with migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "🔨 Applying migrations..."

# Apply each migration
for migration in "${MIGRATIONS[@]}"; do
  echo "  → Applying $migration..."

  if [ -f "$MIGRATION_DIR/$migration" ]; then
    # Use psql if available, otherwise use Prisma
    if command -v psql &> /dev/null; then
      psql "$DB_URL" -f "$MIGRATION_DIR/$migration" -v ON_ERROR_STOP=1
    else
      # Fallback: execute via Prisma db execute
      npx prisma db execute --file "$MIGRATION_DIR/$migration" --schema prisma/schema.prisma
    fi
    echo "  ✅ $migration applied successfully"
  else
    echo "  ⚠️  Warning: $migration not found, skipping..."
  fi
done

echo ""
echo "🎉 All migrations completed successfully!"
echo ""
echo "📊 Next steps:"
echo "  1. Verify tables: npx prisma db pull"
echo "  2. Run application: npm run start:dev"
echo "  3. Check Supabase Dashboard for Realtime status"
echo ""
