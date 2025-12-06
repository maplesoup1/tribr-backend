-- Additional database constraints and checks
-- These complement the Prisma schema with database-level validations

-- 1. Add CHECK constraint for connections table
-- Ensures userA is always less than userB to prevent duplicate connections
ALTER TABLE connections
ADD CONSTRAINT IF NOT EXISTS check_user_a_less_than_user_b
CHECK ("userA" < "userB");

-- 2. Add spatial index for user_locations (requires PostGIS)
CREATE INDEX IF NOT EXISTS idx_user_locations_geo
ON user_locations USING GIST(location);

-- 3. Add partial index for active (non-deleted) messages
CREATE INDEX IF NOT EXISTS idx_messages_active
ON messages("conversationId", "createdAt" DESC)
WHERE "deletedAt" IS NULL;

-- 4. Add index for connection lookups
CREATE INDEX IF NOT EXISTS idx_connections_status
ON connections(status)
WHERE status = 'accepted';

-- 5. Add index for pending invites (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_invites_pending_expired
ON conversation_invites(status, "expiresAt")
WHERE status = 'pending' AND "expiresAt" IS NOT NULL;
