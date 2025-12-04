-- Schema Fixes: Data Integrity Improvements
-- Addresses code review findings

-- =====================================================
-- 1. Create JourneyStatus Enum
-- =====================================================

DO $$ BEGIN
  CREATE TYPE "JourneyStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. Add CHECK Constraints
-- =====================================================

-- Prevent self-connections
DO $$ BEGIN
  ALTER TABLE connections
  ADD CONSTRAINT check_no_self_connection
  CHECK ("userA" != "userB");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure userA is always less than userB (already exists from 01_add_constraints.sql)
-- This prevents duplicate bidirectional connections

-- Prevent self-blocking
DO $$ BEGIN
  ALTER TABLE user_blocks
  ADD CONSTRAINT check_no_self_block
  CHECK ("blockerId" != "blockedId");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure valid date range for journeys
DO $$ BEGIN
  ALTER TABLE journeys
  ADD CONSTRAINT check_valid_date_range
  CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. Update Journey.status to use enum
-- =====================================================

-- Add new column with enum type
ALTER TABLE journeys
ADD COLUMN IF NOT EXISTS status_new "JourneyStatus" DEFAULT 'draft';

-- Migrate existing data (map string values to enum)
UPDATE journeys
SET status_new =
  CASE
    WHEN status IS NULL THEN 'draft'::"JourneyStatus"
    WHEN LOWER(status) = 'active' THEN 'active'::"JourneyStatus"
    WHEN LOWER(status) = 'completed' THEN 'completed'::"JourneyStatus"
    WHEN LOWER(status) = 'cancelled' THEN 'cancelled'::"JourneyStatus"
    ELSE 'draft'::"JourneyStatus"
  END;

-- Drop old column
ALTER TABLE journeys DROP COLUMN IF EXISTS status;

-- Rename new column
ALTER TABLE journeys RENAME COLUMN status_new TO status;

-- Set NOT NULL and default
ALTER TABLE journeys ALTER COLUMN status SET NOT NULL;
ALTER TABLE journeys ALTER COLUMN status SET DEFAULT 'draft';

-- =====================================================
-- 4. Add Foreign Key for Conversation.lastMessageId
-- =====================================================

-- Add unique constraint to lastMessageId (required for 1:1 relation)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_last_message_id_key
ON conversations("lastMessageId")
WHERE "lastMessageId" IS NOT NULL;

-- Add foreign key relationship
DO $$ BEGIN
  ALTER TABLE conversations
  ADD CONSTRAINT conversations_lastMessageId_fkey
  FOREIGN KEY ("lastMessageId")
  REFERENCES messages(id)
  ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 5. Add SET NULL to Message.journeyId
-- =====================================================

-- Drop existing constraint if exists
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_journeyId_fkey;

-- Re-add with SET NULL on delete
ALTER TABLE messages
ADD CONSTRAINT messages_journeyId_fkey
FOREIGN KEY ("journeyId")
REFERENCES journeys(id)
ON DELETE SET NULL;

-- =====================================================
-- 6. Add Unique Constraint to ConversationInvite
-- =====================================================

-- Prevent duplicate invites for the same user in the same conversation with same status
CREATE UNIQUE INDEX IF NOT EXISTS conversation_invites_unique_active
ON conversation_invites("conversationId", "inviteeId", status);

-- =====================================================
-- 7. Verify All Constraints
-- =====================================================

-- Show all check constraints
SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'c'
AND connamespace = 'public'::regnamespace
ORDER BY table_name, conname;
