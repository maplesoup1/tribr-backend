-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple', 'email');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'connections', 'private');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('pending', 'accepted');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('dm', 'group');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'journey', 'system');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+1',
    "email" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "lastSignInAt" TIMESTAMP(3),

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "verificationLevel" SMALLINT NOT NULL DEFAULT 0,
    "archetypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "userA" TEXT NOT NULL,
    "userB" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'pending',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "origin" TEXT,
    "destination" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "tripType" TEXT,
    "title" TEXT,
    "description" TEXT,
    "status" "JourneyStatus" NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "title" TEXT,
    "ownerId" TEXT NOT NULL,
    "lastMessageId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'member',
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "conversation_invites" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "content" TEXT,
    "metadata" JSONB,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "journeyId" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "userId" TEXT NOT NULL,
    "location" geography(Point, 4326),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacy" "Visibility" NOT NULL DEFAULT 'connections',

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_providerId_key" ON "user_identities"("provider", "providerId");

-- CreateIndex
CREATE INDEX "connections_userA_userB_idx" ON "connections"("userA", "userB");

-- CreateIndex
CREATE UNIQUE INDEX "connections_userA_userB_key" ON "connections"("userA", "userB");

-- CreateIndex
CREATE INDEX "journeys_userId_startDate_endDate_idx" ON "journeys"("userId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_lastMessageId_key" ON "conversations"("lastMessageId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_invites_conversationId_inviteeId_status_key" ON "conversation_invites"("conversationId", "inviteeId", "status");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_userA_fkey" FOREIGN KEY ("userA") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_userB_fkey" FOREIGN KEY ("userB") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_invites" ADD CONSTRAINT "conversation_invites_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_invites" ADD CONSTRAINT "conversation_invites_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_invites" ADD CONSTRAINT "conversation_invites_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- =====================================================
-- Additional Constraints (from schema fixes)
-- =====================================================

-- Connection constraints
ALTER TABLE connections
ADD CONSTRAINT IF NOT EXISTS check_no_self_connection CHECK ("userA" != "userB");
ALTER TABLE connections
ADD CONSTRAINT IF NOT EXISTS check_user_a_less_than_user_b CHECK ("userA" < "userB");

-- UserBlock constraints
ALTER TABLE user_blocks
ADD CONSTRAINT IF NOT EXISTS check_no_self_block CHECK ("blockerId" != "blockedId");

-- Journey date validation
ALTER TABLE journeys
ADD CONSTRAINT IF NOT EXISTS check_valid_date_range
CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate");

-- ConversationInvite unique constraint
-- Note: unique on (conversationId, inviteeId, status) already created above.

-- Spatial index for user_locations
CREATE INDEX IF NOT EXISTS idx_user_locations_geo
ON user_locations USING GIST(location);

-- Partial indexes for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_messages_active
ON messages("conversationId", "createdAt" DESC)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_connections_status
ON connections(status)
WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_invites_pending_expired
ON conversation_invites(status, "expiresAt")
WHERE status = 'pending' AND "expiresAt" IS NOT NULL;
