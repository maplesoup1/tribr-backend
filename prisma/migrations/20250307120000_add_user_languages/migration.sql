-- Create enum for language proficiency
CREATE TYPE "LanguageProficiency" AS ENUM ('native', 'fluent', 'conversational', 'basic');

-- User languages table
CREATE TABLE "user_languages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" "LanguageProficiency" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "user_languages_user_id_language_key" UNIQUE ("user_id", "language"),
    CONSTRAINT "user_languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "user_languages_user_id_idx" ON "user_languages" ("user_id");
