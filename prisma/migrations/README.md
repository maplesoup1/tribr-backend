# Database Migrations Guide

## 📋 Migration Files Overview

All migration files are **idempotent** - safe to run multiple times without causing errors.

### ⚠️ CRITICAL: Execution Order

**Execute migrations in this EXACT order:**

```
0. baseline.sql             → [NEW DB ONLY] Complete schema from scratch
   ↓
1. 00_enable_postgis.sql    → Enable PostGIS extension
2. 01_add_constraints.sql   → Add CHECK constraints and indexes
3. 02_triggers.sql          → Create database triggers
4. 03_enable_realtime.sql   → Enable Supabase Realtime
5. 04_rls_final.sql        → Configure Row Level Security ⭐ IDEMPOTENT
6. 05_migrate_user_data.sql → Migrate user data to profiles ⭐ SMART
7. 06_schema_fixes.sql      → Schema integrity fixes
```

---

## 📝 File Details

### `baseline.sql` - Complete Schema
- **Use**: New environments ONLY
- **Includes**: All tables, enums, indexes, constraints
- **NOT Idempotent**: Will fail if tables exist
- **Skip**: If database already has tables

### `00_enable_postgis.sql`
✅ **Idempotent**: Uses `CREATE EXTENSION IF NOT EXISTS`

Enables PostGIS for geography support (Discovery Map locations).

### `01_add_constraints.sql`
✅ **Idempotent**: Uses `IF NOT EXISTS` and exception handling

Adds:
- CHECK: `userA < userB` (prevent duplicate connections)
- CHECK: `userA != userB` (prevent self-connections)
- Spatial GIST index on `user_locations`
- Partial indexes for performance

### `02_triggers.sql`
✅ **Idempotent**: Uses `CREATE OR REPLACE FUNCTION`

Creates 3 triggers:
1. Auto-update conversation last_message
2. Handle message soft-deletes
3. Track location update timestamps

### `03_enable_realtime.sql`
✅ **Idempotent**: `ALTER PUBLICATION` is safe to repeat

Enables Realtime for 5 tables:
- messages, user_locations, connections, conversation_participants, conversations

### `04_rls_final.sql` ⭐
✅ **FULLY IDEMPOTENT**: **Drops all policies before recreating**

**Key Features**:
- Safe to run in production (no downtime)
- Updates policies with latest logic
- Handles policy name changes gracefully

**Production Updates**: Run anytime to update RLS logic.

### `05_migrate_user_data.sql` ⭐
✅ **SMART & IDEMPOTENT**: **Detects if migration is needed**

**Intelligence**:
- Checks if old columns exist (`fullName`, `photoUrl`, etc.)
- Skips if already migrated
- Handles both camelCase and snake_case
- Provides clear status messages

**Safe**: Will not corrupt existing data.

### `06_schema_fixes.sql`
⚠️ **Partially Idempotent**

Adds:
- `JourneyStatus` enum
- Additional CHECK constraints
- Foreign key fixes (lastMessageId, journeyId SET NULL)
- Unique constraint on conversation_invites

---

## 🚀 Quick Start

### New Database (Fresh Install)

```bash
cd tribr-backend

# Option 1: Use baseline (fastest)
psql $DIRECT_URL -f prisma/migrations/baseline.sql
psql $DIRECT_URL -f prisma/migrations/02_triggers.sql
psql $DIRECT_URL -f prisma/migrations/03_enable_realtime.sql
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql

# Option 2: Run all numbered migrations
psql $DIRECT_URL -f prisma/migrations/00_enable_postgis.sql
psql $DIRECT_URL -f prisma/migrations/01_add_constraints.sql
psql $DIRECT_URL -f prisma/migrations/02_triggers.sql
psql $DIRECT_URL -f prisma/migrations/03_enable_realtime.sql
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql
psql $DIRECT_URL -f prisma/migrations/06_schema_fixes.sql
```

### Existing Database (Update)

```bash
cd tribr-backend

# Safe to run all - they're idempotent
for file in 00 01 02 03 04 05 06; do
  psql $DIRECT_URL -f prisma/migrations/${file}*.sql
done
```

### Update RLS Policies Only

```bash
# Safe to run anytime - drops/recreates policies
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql
```

---

## ✅ Verification

Run after migrations to verify success:

```sql
-- 1. Check all tables exist (should see 12)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verify PostGIS
SELECT PostGIS_version();

-- 3. Verify RLS enabled (should see 8 tables)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- 4. Check triggers (should see 3)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 6. Verify CHECK constraints (should see 4)
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace;
```

**Expected Counts**:
- Tables: 12
- PostGIS version: 3.x
- Realtime tables: 5
- RLS-enabled tables: 8
- Triggers: 3
- CHECK constraints: 4+

---

## ⚠️ Idempotency Reference

| File | Safe to Re-run? | Method |
|------|----------------|--------|
| baseline.sql | ❌ No | One-time use |
| 00_enable_postgis | ✅ Yes | `IF NOT EXISTS` |
| 01_add_constraints | ✅ Yes | Exception handling |
| 02_triggers | ✅ Yes | `CREATE OR REPLACE` |
| 03_enable_realtime | ✅ Yes | Safe ALTER |
| 04_rls_final | ✅ **YES** | **Drops first** |
| 05_migrate_user_data | ✅ **YES** | **Smart detection** |
| 06_schema_fixes | ⚠️ Partial | Some operations |

---

## 🛠 Common Scenarios

### Scenario 1: Updating RLS Policies

```bash
# Production-safe - no downtime
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql
```

### Scenario 2: Fresh Clone (Developer Setup)

```bash
# Use Prisma for schema
npx prisma db push

# Then apply custom SQL
psql $DIRECT_URL -f prisma/migrations/02_triggers.sql
psql $DIRECT_URL -f prisma/migrations/03_enable_realtime.sql
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql
```

### Scenario 3: Production Update

```bash
# Run all migrations in order (idempotent)
for i in 00 01 02 03 04 05 06; do
  echo "Applying migration ${i}..."
  psql $DIRECT_URL -f prisma/migrations/${i}*.sql
done
```

### Scenario 4: Rollback RLS Changes

```bash
# If RLS policies cause issues, disable temporarily
psql $DIRECT_URL -c "ALTER TABLE messages DISABLE ROW LEVEL SECURITY;"

# Fix policies, then re-enable
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql
```

---

## 🔧 Troubleshooting

### "extension postgis does not exist"
**Solution**: Enable in Supabase Dashboard → Extensions → search "postgis"

### "policy already exists"
**Solution**: Use `04_rls_final.sql` - it drops policies first

### "column not found" in 05_migrate_user_data
**Normal**: Script detects migration is not needed (already done)

### "relation already exists"
**Normal**: Script uses `IF NOT EXISTS` - safely continues

### RLS blocking queries in development
```sql
-- Temporarily disable for testing
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
psql $DIRECT_URL -f prisma/migrations/04_rls_final.sql
```

---

## 📚 Related Documentation

- [SCHEMA_FIXES_REPORT.md](../../SCHEMA_FIXES_REPORT.md) - Data integrity improvements
- [MIGRATION_COMPLETE.md](../../MIGRATION_COMPLETE.md) - Migration completion report
- [DATABASE_IMPLEMENTATION_SUMMARY.md](../../DATABASE_IMPLEMENTATION_SUMMARY.md) - Full overview

---

**Questions?** Check [MANUAL_MIGRATION_GUIDE.md](../../MANUAL_MIGRATION_GUIDE.md) for detailed step-by-step instructions.
