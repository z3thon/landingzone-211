-- Add discord_invite_url field to communities table
ALTER TABLE communities ADD COLUMN IF NOT EXISTS discord_invite_url TEXT;
