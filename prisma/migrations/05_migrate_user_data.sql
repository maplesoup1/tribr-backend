-- Migrate existing user data to new schema structure (IDEMPOTENT)
-- This script safely moves data from users table to profiles table
-- Safe to run multiple times - checks for column existence

-- =====================================================
-- 1. Create profiles from existing users data
-- =====================================================

DO $$
DECLARE
  has_full_name BOOLEAN;
  has_photo_url BOOLEAN;
  has_archetypes BOOLEAN;
  has_interests BOOLEAN;
  has_bio BOOLEAN;
BEGIN
  -- Check if old columns exist (snake_case from original schema)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name IN ('fullName', 'full_name')
  ) INTO has_full_name;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name IN ('photoUrl', 'photo_url')
  ) INTO has_photo_url;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'archetypes'
  ) INTO has_archetypes;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'interests'
  ) INTO has_interests;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) INTO has_bio;

  -- Only run migration if old columns exist
  IF has_full_name OR has_photo_url OR has_archetypes OR has_interests OR has_bio THEN
    RAISE NOTICE 'Old user columns detected, migrating data to profiles...';

    -- Use dynamic SQL to handle both naming conventions
    EXECUTE format('
      INSERT INTO profiles (
        "userId",
        "fullName",
        "avatarUrl",
        visibility,
        "verificationLevel",
        archetypes,
        interests,
        bio
      )
      SELECT
        id,
        %s,
        %s,
        ''public''::visibility,
        0,
        %s,
        %s,
        %s
      FROM users
      WHERE NOT EXISTS (
        SELECT 1 FROM profiles WHERE profiles."userId" = users.id
      )
      ON CONFLICT ("userId") DO NOTHING',
      CASE WHEN has_full_name THEN
        (SELECT CASE WHEN column_name = 'fullName' THEN '"fullName"' ELSE 'full_name' END
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name IN ('fullName', 'full_name')
         LIMIT 1)
      ELSE 'NULL' END,
      CASE WHEN has_photo_url THEN
        (SELECT CASE WHEN column_name = 'photoUrl' THEN '"photoUrl"' ELSE 'photo_url' END
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name IN ('photoUrl', 'photo_url')
         LIMIT 1)
      ELSE 'NULL' END,
      CASE WHEN has_archetypes THEN 'archetypes' ELSE 'ARRAY[]::text[]' END,
      CASE WHEN has_interests THEN 'interests' ELSE 'ARRAY[]::text[]' END,
      CASE WHEN has_bio THEN 'bio' ELSE 'NULL' END
    );

    RAISE NOTICE 'Migration complete. Old columns can now be safely dropped.';
  ELSE
    RAISE NOTICE 'Old user columns not found - migration already completed or not needed.';
  END IF;
END $$;

-- =====================================================
-- 2. Verify migration
-- =====================================================

-- Check that all users have profiles
DO $$
DECLARE
  users_count INTEGER;
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO profiles_count FROM profiles;

  IF users_count > 0 AND profiles_count = 0 THEN
    RAISE WARNING 'No profiles found but % users exist - migration may have failed', users_count;
  ELSIF users_count != profiles_count THEN
    RAISE NOTICE 'Migration status: % users, % profiles', users_count, profiles_count;
  ELSE
    RAISE NOTICE 'Migration successful: % users have profiles', users_count;
  END IF;
END $$;

-- =====================================================
-- 3. Remove migrated columns from users table
-- =====================================================

-- Note: This will be handled by Prisma migrations
-- We don't drop columns here to allow rollback if needed
-- After confirming migration success, manually run:
--
-- ALTER TABLE users DROP COLUMN IF EXISTS "fullName";
-- ALTER TABLE users DROP COLUMN IF EXISTS "photoUrl";
-- ALTER TABLE users DROP COLUMN IF EXISTS archetypes;
-- ALTER TABLE users DROP COLUMN IF EXISTS interests;
-- ALTER TABLE users DROP COLUMN IF EXISTS bio;
