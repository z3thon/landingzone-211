-- Add bot configuration fields to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS coach_channel_name TEXT,
ADD COLUMN IF NOT EXISTS coach_role_id TEXT,
ADD COLUMN IF NOT EXISTS coach_channel_id TEXT;

-- Add index for bot-enabled communities
CREATE INDEX IF NOT EXISTS idx_communities_bot_enabled ON communities(bot_enabled) WHERE bot_enabled = true;

-- Add comments
COMMENT ON COLUMN communities.bot_enabled IS 'Whether the Discord bot is enabled for this community';
COMMENT ON COLUMN communities.coach_channel_name IS 'Name of the voice channel that coaches join to start coaching sessions';
COMMENT ON COLUMN communities.coach_role_id IS 'Discord role ID for authorized coaches';
COMMENT ON COLUMN communities.coach_channel_id IS 'Discord channel ID of the coach voice channel';
