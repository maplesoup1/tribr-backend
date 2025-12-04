-- Row Level Security (RLS) Policies - Idempotent Version
-- Safe to run multiple times - drops existing policies before recreation

-- =====================================================
-- CLEANUP: Drop all existing policies first
-- =====================================================

DO $$
BEGIN
  -- Messages
  DROP POLICY IF EXISTS "Users can read messages from their conversations" ON messages;
  DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
  DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

  -- User Locations
  DROP POLICY IF EXISTS "Users can read locations based on privacy" ON user_locations;
  DROP POLICY IF EXISTS "Users can update their own location" ON user_locations;

  -- Connections
  DROP POLICY IF EXISTS "Users can see their own connections" ON connections;
  DROP POLICY IF EXISTS "Users can create connection requests" ON connections;
  DROP POLICY IF EXISTS "Users can accept connection requests" ON connections;

  -- Conversations
  DROP POLICY IF EXISTS "Users can see their conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
  DROP POLICY IF EXISTS "Owners can update conversations" ON conversations;

  -- Conversation Participants
  DROP POLICY IF EXISTS "Users can see conversation participants" ON conversation_participants;
  DROP POLICY IF EXISTS "Owners can add participants" ON conversation_participants;
  DROP POLICY IF EXISTS "Users can update own participation" ON conversation_participants;

  -- Profiles
  DROP POLICY IF EXISTS "Users can read profiles based on visibility" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

  -- Journeys
  DROP POLICY IF EXISTS "Users can read journeys based on profile visibility" ON journeys;
  DROP POLICY IF EXISTS "Users can manage their own journeys" ON journeys;

  -- User Blocks
  DROP POLICY IF EXISTS "Users can see their blocks" ON user_blocks;
  DROP POLICY IF EXISTS "Users can block others" ON user_blocks;
  DROP POLICY IF EXISTS "Users can unblock" ON user_blocks;
END $$;

-- =====================================================
-- 1. MESSAGES
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages from their conversations"
ON messages FOR SELECT
USING (
  "conversationId" IN (
    SELECT "conversationId"
    FROM conversation_participants
    WHERE "userId" = auth.uid()::text
  )
  AND "deletedAt" IS NULL
);

CREATE POLICY "Users can send messages to their conversations"
ON messages FOR INSERT
WITH CHECK (
  "senderId" = auth.uid()::text
  AND "conversationId" IN (
    SELECT "conversationId"
    FROM conversation_participants
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their own messages"
ON messages FOR UPDATE
USING ("senderId" = auth.uid()::text)
WITH CHECK ("senderId" = auth.uid()::text AND "deletedBy" = auth.uid()::text);

-- =====================================================
-- 2. USER_LOCATIONS
-- =====================================================

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read locations based on privacy"
ON user_locations FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR privacy = 'public'
  OR (
    privacy = 'connections'
    AND EXISTS (
      SELECT 1 FROM connections
      WHERE status = 'accepted'
      AND (
        ("userA" = auth.uid()::text AND "userB" = user_locations."userId")
        OR ("userB" = auth.uid()::text AND "userA" = user_locations."userId")
      )
    )
  )
);

CREATE POLICY "Users can update their own location"
ON user_locations FOR ALL
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

-- =====================================================
-- 3. CONNECTIONS
-- =====================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own connections"
ON connections FOR SELECT
USING ("userA" = auth.uid()::text OR "userB" = auth.uid()::text);

CREATE POLICY "Users can create connection requests"
ON connections FOR INSERT
WITH CHECK ("userA" = auth.uid()::text OR "userB" = auth.uid()::text);

CREATE POLICY "Users can accept connection requests"
ON connections FOR UPDATE
USING ("userB" = auth.uid()::text AND status = 'pending')
WITH CHECK ("userB" = auth.uid()::text AND status = 'accepted');

-- =====================================================
-- 4. CONVERSATIONS
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their conversations"
ON conversations FOR SELECT
USING (
  id IN (
    SELECT "conversationId"
    FROM conversation_participants
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY "Owners can update conversations"
ON conversations FOR UPDATE
USING ("ownerId" = auth.uid()::text)
WITH CHECK ("ownerId" = auth.uid()::text);

-- =====================================================
-- 5. CONVERSATION_PARTICIPANTS
-- =====================================================

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see conversation participants"
ON conversation_participants FOR SELECT
USING (
  "conversationId" IN (
    SELECT "conversationId"
    FROM conversation_participants
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Owners can add participants"
ON conversation_participants FOR INSERT
WITH CHECK (
  "conversationId" IN (
    SELECT id FROM conversations
    WHERE "ownerId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own participation"
ON conversation_participants FOR UPDATE
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

-- =====================================================
-- 6. PROFILES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read profiles based on visibility"
ON profiles FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR visibility = 'public'
  OR (
    visibility = 'connections'
    AND EXISTS (
      SELECT 1 FROM connections
      WHERE status = 'accepted'
      AND (
        ("userA" = auth.uid()::text AND "userB" = profiles."userId")
        OR ("userB" = auth.uid()::text AND "userA" = profiles."userId")
      )
    )
  )
);

CREATE POLICY "Users can update their own profile"
ON profiles FOR ALL
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

-- =====================================================
-- 7. JOURNEYS
-- =====================================================

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read journeys based on profile visibility"
ON journeys FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR "userId" IN (
    SELECT "userId" FROM profiles WHERE visibility = 'public'
  )
  OR (
    "userId" IN (
      SELECT "userId" FROM profiles WHERE visibility = 'connections'
    )
    AND EXISTS (
      SELECT 1 FROM connections
      WHERE status = 'accepted'
      AND (
        ("userA" = auth.uid()::text AND "userB" = journeys."userId")
        OR ("userB" = auth.uid()::text AND "userA" = journeys."userId")
      )
    )
  )
);

CREATE POLICY "Users can manage their own journeys"
ON journeys FOR ALL
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

-- =====================================================
-- 8. USER_BLOCKS
-- =====================================================

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their blocks"
ON user_blocks FOR SELECT
USING ("blockerId" = auth.uid()::text);

CREATE POLICY "Users can block others"
ON user_blocks FOR INSERT
WITH CHECK ("blockerId" = auth.uid()::text);

CREATE POLICY "Users can unblock"
ON user_blocks FOR DELETE
USING ("blockerId" = auth.uid()::text);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
