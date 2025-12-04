-- Enable Supabase Realtime for tables
-- This allows frontend to subscribe to database changes

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify tables are in the publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
