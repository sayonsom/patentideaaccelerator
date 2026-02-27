-- Add nullable local-password hash for credentials auth.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

