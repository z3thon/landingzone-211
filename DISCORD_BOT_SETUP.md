# Discord Bot Setup Guide

This guide explains how to set up and use the Landing Zone Discord bot for automated voice channel management and billable time tracking.

## Overview

The Discord bot automatically:
- Detects when coaches join designated "Coach" voice channels
- Creates temporary voice channels with the coach's hourly rate in the title
- Tracks billable time when attendees join coaching sessions
- Reports all events back to the Landing Zone server

## Prerequisites

1. **Discord Bot Application**
   - Create a Discord application at https://discord.com/developers/applications
   - Create a bot user and copy the bot token
   - Enable the following bot intents:
     - **Server Members Intent** (required) - Needed to fetch member data and assign roles
     - **Message Content Intent** - NOT required (only needed if bot reads message content)
     - **Presence Intent** - NOT required (only needed to track user online/offline status)
   - **Invite the bot to your Discord server with Administrator permissions (permission integer: 8)**
     - This is required because the bot needs to:
       - Create and manage voice channels
       - Set channel permissions
       - Create roles
       - Move members between channels
   
   **Bot Invite URL Format:**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot
   ```
   
   Replace `YOUR_CLIENT_ID` with your Discord application's client ID.

2. **Environment Variables**
   Add the following to your `.env` file:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_CLIENT_SECRET=your_client_secret_here
   ```

3. **Database Migration**
   Run the database migration to add bot configuration fields:
   ```bash
   # Apply migration 005_add_bot_configuration.sql
   ```

## Setup Steps

### 1. Configure Community Discord Server

In your Landing Zone dashboard:
1. Go to Community Settings
2. Connect your Discord account (if not already connected)
3. Link your Discord server (guild) to the community
4. Set the "Coach Channel Name" - this is the name of the voice channel where coaches will join to start sessions
5. Start the bot - this will automatically:
   - Create a "Landing Zone Coach" role
   - Create the Coach voice channel with proper permissions
   - Configure the bot to monitor the channel

### 2. Authorize Coaches

Coaches must:
1. Have a Discord account linked to their Landing Zone profile
2. Set a coaching rate in their profile settings
3. Be members of the community

When a user sets a coaching rate, they automatically receive the "Landing Zone Coach" Discord role, which grants access to the Coach channel.

### 3. Start the Bot

#### Option A: Via API (Recommended for Production)

Use the API endpoints to start/stop the bot:

**Start Bot:**
```bash
POST /api/discord/bot/start
{
  "community_id": "uuid",
  "coach_channel_name": "Coach"
}
```

**Stop Bot:**
```bash
POST /api/discord/bot/stop
{
  "community_id": "uuid"
}
```

**Check Status:**
```bash
GET /api/discord/bot/status?community_id=uuid
```

#### Option B: Via Script (For Development)

Run the bot startup script:
```bash
npm run bot
```

This will:
- Connect to Discord
- Register all communities with `bot_enabled = true`
- Start monitoring voice channels

## How It Works

### Coach Authorization

1. When a user sets a coaching rate in their profile, they automatically receive the "Landing Zone Coach" Discord role
2. This role grants access to the "Coach" voice channel (created during bot setup)
3. Only users with the coach role can see and join the Coach channel

### Coach Joins "Coach" Channel

1. Coach (with coach role) joins the designated "Coach" voice channel
2. Bot verifies user has the coach role (Discord handles permissions)
3. Bot gets coach's hourly rate from their profile
4. Bot creates a temporary voice channel:
   - Name format: `💰 $X/hr - CoachName`
   - Coach is moved to the new channel
   - Channel permissions: Only coach can see/join initially
4. Bot creates a `voice_channels` record in the database

### Attendee Joins Coaching Channel

1. Attendee joins the temporary coaching channel
2. Bot verifies attendee has a linked profile
3. Bot creates a `call_sessions` record:
   - Status: `active`
   - Tracks start time
   - Links coach and attendee profiles
4. Time tracking begins automatically

### Session Ends

1. When coach or attendee leaves the channel:
   - Bot calculates duration
   - Updates `call_sessions` record:
     - Sets `ended_at` timestamp
     - Calculates `duration_minutes`
     - Sets status to `completed`
2. Bot deletes the temporary voice channel
3. Billing events are processed (if configured)

## API Endpoints

### Start Bot
`POST /api/discord/bot/start`
- Requires: Admin/Owner role in community
- Body: `{ community_id, coach_channel_name }`
- Starts bot monitoring for the specified community

### Stop Bot
`POST /api/discord/bot/stop`
- Requires: Admin/Owner role in community
- Body: `{ community_id }`
- Stops bot monitoring and cleans up active sessions

### Bot Status
`GET /api/discord/bot/status?community_id=uuid`
- Returns bot configuration and status for a community
- If no `community_id` provided, returns all communities user is admin/owner of

## Troubleshooting

### Bot Not Responding

1. Check bot is online in Discord
2. Verify `DISCORD_BOT_TOKEN` is set correctly
3. **Verify bot has Administrator permissions (permission integer: 8)**
4. Check bot has necessary permissions in Discord server
5. Verify bot intents are enabled in Discord Developer Portal
6. Ensure bot's role is high enough in Discord role hierarchy (should be near the top)

### Coach Not Authorized

1. Verify Discord account is linked to Landing Zone profile
2. Check coaching rate is set in profile settings
3. Ensure user is a member of the community
4. Check `coaching_rate_id` is set in `profiles` table

### Channel Not Created

1. Verify bot has "Manage Channels" permission
2. Check coach channel name matches exactly (case-insensitive)
3. Ensure bot has permission to create channels in the category
4. Check Discord server limits (max channels)

### Sessions Not Tracking

1. Verify both coach and attendee have linked Discord accounts
2. Check `call_sessions` table for errors
3. Review bot logs for errors
4. Ensure database connection is working

## Security Considerations

- Bot token should be kept secret and never committed to version control
- Use environment variables for all sensitive configuration
- Bot only responds to authorized coaches
- All database operations use service role client (bypasses RLS)
- Voice channels are automatically cleaned up on bot shutdown

## Development

### Running Locally

1. Set up environment variables
2. Run database migrations
3. Start Next.js dev server: `npm run dev`
4. In a separate terminal, start bot: `npm run bot`

### Testing

Test the bot flow:
1. Create a test community
2. Link Discord server
3. Set coach channel name
4. Start bot via API
5. Join Discord voice channel as coach
6. Verify temporary channel is created
7. Join as attendee
8. Verify session is tracked
9. Leave channel
10. Verify session ends and channel is deleted

## Production Deployment

### Recommended Setup

1. Run bot as a separate service/process
2. Use process manager (PM2, systemd, etc.)
3. Set up monitoring and logging
4. Configure auto-restart on failure
5. Use environment-specific configuration

### Environment Variables

Required for production:
```
DISCORD_BOT_TOKEN=production_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
```

## Support

For issues or questions:
- Check bot logs for errors
- Review Discord Developer Portal for bot status
- Verify database records are being created correctly
- Check API endpoint responses for error messages
