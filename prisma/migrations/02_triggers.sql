-- Database triggers for automated updates
-- These maintain data consistency without application logic

-- =====================================================
-- 1. Auto-update conversation last_message info
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if message is not deleted
  IF NEW."deletedAt" IS NULL THEN
    UPDATE conversations
    SET
      "lastMessageId" = NEW.id,
      "lastMessageAt" = NEW."createdAt",
      "updatedAt" = NOW()
    WHERE id = NEW."conversationId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- 2. Update conversation timestamp when message deleted
-- =====================================================

CREATE OR REPLACE FUNCTION handle_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a message is deleted, update conversation timestamp
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    UPDATE conversations
    SET "updatedAt" = NOW()
    WHERE id = NEW."conversationId";

    -- If this was the last message, find the new last message
    IF NEW.id = (SELECT "lastMessageId" FROM conversations WHERE id = NEW."conversationId") THEN
      UPDATE conversations
      SET
        "lastMessageId" = (
          SELECT id FROM messages
          WHERE "conversationId" = NEW."conversationId"
            AND "deletedAt" IS NULL
          ORDER BY "createdAt" DESC
          LIMIT 1
        ),
        "lastMessageAt" = (
          SELECT "createdAt" FROM messages
          WHERE "conversationId" = NEW."conversationId"
            AND "deletedAt" IS NULL
          ORDER BY "createdAt" DESC
          LIMIT 1
        )
      WHERE id = NEW."conversationId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_message_deletion
AFTER UPDATE ON messages
FOR EACH ROW
WHEN (OLD."deletedAt" IS NULL AND NEW."deletedAt" IS NOT NULL)
EXECUTE FUNCTION handle_message_deletion();

-- =====================================================
-- 3. Auto-update user_locations timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_timestamp
BEFORE UPDATE ON user_locations
FOR EACH ROW
WHEN (OLD.location IS DISTINCT FROM NEW.location)
EXECUTE FUNCTION update_location_timestamp();
