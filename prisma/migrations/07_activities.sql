-- Migration: Add Activities (Discover Feature)
-- This migration adds support for activities/events that users can create and join

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE "ActivityTimeType" AS ENUM ('flexible', 'specific');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityPrivacy" AS ENUM ('open', 'private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityStatus" AS ENUM ('active', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityParticipantStatus" AS ENUM ('joined', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityParticipantRole" AS ENUM ('host', 'guest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ALTER PROFILES - Add gender and birthDate
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "birthDate" DATE;

-- =====================================================
-- 3. CREATE ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "activities" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "emoji" TEXT,
    "description" TEXT,
    "date" DATE NOT NULL,
    "timeType" "ActivityTimeType" NOT NULL DEFAULT 'flexible',
    "specificTime" TIME,
    "locationText" TEXT,
    "location" geography(Point, 4326),
    "privacy" "ActivityPrivacy" NOT NULL DEFAULT 'open',
    "womenOnly" BOOLEAN NOT NULL DEFAULT false,
    "ageMin" INTEGER NOT NULL DEFAULT 18,
    "ageMax" INTEGER NOT NULL DEFAULT 99,
    "status" "ActivityStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "activities"
ADD CONSTRAINT "activities_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add CHECK constraints
ALTER TABLE "activities"
ADD CONSTRAINT IF NOT EXISTS "check_age_range" CHECK ("ageMin" >= 0 AND "ageMax" <= 150 AND "ageMin" <= "ageMax");

-- Fix #2: timeType='specific' 必须有 specificTime
ALTER TABLE "activities"
ADD CONSTRAINT IF NOT EXISTS "check_specific_time" CHECK (
  ("timeType" = 'flexible' AND "specificTime" IS NULL) OR
  ("timeType" = 'specific' AND "specificTime" IS NOT NULL)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "activities_privacy_status_date_idx" ON "activities"("privacy", "status", "date");
CREATE INDEX IF NOT EXISTS "activities_creatorId_idx" ON "activities"("creatorId");
CREATE INDEX IF NOT EXISTS "activities_location_idx" ON "activities" USING GIST("location");
CREATE INDEX IF NOT EXISTS "activities_status_date_idx" ON "activities"("status", "date") WHERE "status" = 'active';

-- =====================================================
-- 4. CREATE ACTIVITY_PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "activity_participants" (
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ActivityParticipantStatus" NOT NULL DEFAULT 'joined',
    "role" "ActivityParticipantRole" NOT NULL DEFAULT 'guest',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_participants_pkey" PRIMARY KEY ("activityId", "userId")
);

-- Add foreign keys
ALTER TABLE "activity_participants"
ADD CONSTRAINT "activity_participants_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_participants"
ADD CONSTRAINT "activity_participants_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "activity_participants_userId_status_idx" ON "activity_participants"("userId", "status");
CREATE INDEX IF NOT EXISTS "activity_participants_activityId_idx" ON "activity_participants"("activityId");

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Drop existing policies if any
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can see open activities" ON activities;
  DROP POLICY IF EXISTS "Users can see private activities they participate in" ON activities;
  DROP POLICY IF EXISTS "Users can create activities" ON activities;
  DROP POLICY IF EXISTS "Creators can update their activities" ON activities;
  DROP POLICY IF EXISTS "Creators can delete their activities" ON activities;

  DROP POLICY IF EXISTS "Users can see participants of visible activities" ON activity_participants;
  DROP POLICY IF EXISTS "Users can join open activities" ON activity_participants;
  DROP POLICY IF EXISTS "Users can join or be added to activities" ON activity_participants;
  DROP POLICY IF EXISTS "Hosts can manage participants" ON activity_participants;
  DROP POLICY IF EXISTS "Users can leave activities" ON activity_participants;
END $$;

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ACTIVITIES POLICIES
-- =====================================================

-- SELECT: Users can see open/active activities OR activities they participate in
CREATE POLICY "Users can see open activities"
ON activities FOR SELECT
USING (
  -- Open and active activities
  (privacy = 'open' AND status = 'active')
  OR
  -- Activities user created
  "creatorId" = auth.uid()::text
  OR
  -- Activities user participates in
  id IN (
    SELECT "activityId" FROM activity_participants
    WHERE "userId" = auth.uid()::text
  )
);

-- INSERT: Any authenticated user can create activities
CREATE POLICY "Users can create activities"
ON activities FOR INSERT
WITH CHECK (
  "creatorId" = auth.uid()::text
);

-- UPDATE: Only creator can update their activity
CREATE POLICY "Creators can update their activities"
ON activities FOR UPDATE
USING ("creatorId" = auth.uid()::text)
WITH CHECK ("creatorId" = auth.uid()::text);

-- DELETE: Only creator can delete their activity
CREATE POLICY "Creators can delete their activities"
ON activities FOR DELETE
USING ("creatorId" = auth.uid()::text);

-- =====================================================
-- ACTIVITY_PARTICIPANTS POLICIES
-- =====================================================

-- SELECT: Users can see participants of activities they can see
CREATE POLICY "Users can see participants of visible activities"
ON activity_participants FOR SELECT
USING (
  "activityId" IN (
    SELECT id FROM activities WHERE
      (privacy = 'open' AND status = 'active')
      OR "creatorId" = auth.uid()::text
      OR id IN (
        SELECT "activityId" FROM activity_participants
        WHERE "userId" = auth.uid()::text
      )
  )
);

-- Fix #1: 放宽 INSERT 策略，支持以下场景：
-- 1. 用户自己加入 open 活动
-- 2. Host 为他人添加参与者（邀请/审批）
-- 3. 用户申请加入 private 活动（pending 状态）
CREATE POLICY "Users can join or be added to activities"
ON activity_participants FOR INSERT
WITH CHECK (
  -- 场景1: 用户自己加入 open 活动
  (
    "userId" = auth.uid()::text
    AND "activityId" IN (
      SELECT id FROM activities
      WHERE (privacy = 'open' AND status = 'active')
    )
  )
  OR
  -- 场景2: 创建者/Host 可以添加任何人（邀请场景）
  (
    "activityId" IN (
      SELECT id FROM activities WHERE "creatorId" = auth.uid()::text
    )
    OR
    "activityId" IN (
      SELECT "activityId" FROM activity_participants
      WHERE "userId" = auth.uid()::text AND role = 'host'
    )
  )
  OR
  -- 场景3: 用户申请加入 private 活动（只能以 pending 状态）
  (
    "userId" = auth.uid()::text
    AND status = 'pending'
    AND "activityId" IN (
      SELECT id FROM activities WHERE privacy = 'private' AND status = 'active'
    )
  )
);

-- UPDATE: Hosts can update participant status (for private activities)
CREATE POLICY "Hosts can manage participants"
ON activity_participants FOR UPDATE
USING (
  "activityId" IN (
    SELECT "activityId" FROM activity_participants
    WHERE "userId" = auth.uid()::text AND role = 'host'
  )
)
WITH CHECK (
  "activityId" IN (
    SELECT "activityId" FROM activity_participants
    WHERE "userId" = auth.uid()::text AND role = 'host'
  )
);

-- DELETE: Users can leave activities they joined
CREATE POLICY "Users can leave activities"
ON activity_participants FOR DELETE
USING (
  "userId" = auth.uid()::text
  OR
  -- Hosts can remove participants
  "activityId" IN (
    SELECT "activityId" FROM activity_participants
    WHERE "userId" = auth.uid()::text AND role = 'host'
  )
);

-- =====================================================
-- 6. HELPER FUNCTION: Calculate age from birthDate
-- =====================================================

-- Fix #3: 使用 STABLE 而非 IMMUTABLE，因为依赖 CURRENT_DATE
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 7. TRIGGER: Auto-add creator as host participant
-- =====================================================

CREATE OR REPLACE FUNCTION add_creator_as_host()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_participants ("activityId", "userId", "status", "role", "joinedAt")
  VALUES (NEW.id, NEW."creatorId", 'joined', 'host', NOW())
  ON CONFLICT ("activityId", "userId") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_add_creator_as_host ON activities;
CREATE TRIGGER trigger_add_creator_as_host
AFTER INSERT ON activities
FOR EACH ROW
EXECUTE FUNCTION add_creator_as_host();

-- =====================================================
-- 8. TRIGGER: Update updatedAt timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_activity_timestamp ON activities;
CREATE TRIGGER trigger_update_activity_timestamp
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_activity_timestamp();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 'activities' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'activities' AND table_schema = 'public'
UNION ALL
SELECT 'activity_participants' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'activity_participants' AND table_schema = 'public';

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('activities', 'activity_participants')
ORDER BY tablename, policyname;
