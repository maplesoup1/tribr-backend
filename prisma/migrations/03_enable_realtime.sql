-- Previously enabled Supabase Realtime. Guarded to avoid failures on Cloud SQL.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'realtime_publication') THEN
    ALTER PUBLICATION realtime_publication ADD TABLE messages;
    ALTER PUBLICATION realtime_publication ADD TABLE user_locations;
    ALTER PUBLICATION realtime_publication ADD TABLE connections;
    ALTER PUBLICATION realtime_publication ADD TABLE conversation_participants;
    ALTER PUBLICATION realtime_publication ADD TABLE conversations;
  END IF;
END
$$;
