# Discord Bot Quick Start Guide

## Prerequisites Checklist

- [x] Bot token added to `.env.local` as `DISCORD_BOT_TOKEN`
- [ ] Database migration applied (`005_add_bot_configuration.sql`)
- [ ] Discord bot invited to your server with **Administrator permissions (permission integer: 8)**
- [ ] Bot has "Server Members Intent" enabled in Discord Developer Portal
  - **Note:** Presence Intent is NOT required - only Server Members Intent is needed

### Bot Invite URL

Use this URL format to invite your bot with admin permissions:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot
```

Replace `YOUR_CLIENT_ID` with your Discord application's client ID from the Developer Portal.

## Quick Start Steps

### 1. Apply Database Migration

Run the migration in your Supabase dashboard or via CLI:

```sql
-- File: supabase/migrations/005_add_bot_configuration.sql
-- This adds bot_enabled, coach_channel_name, coach_role_id, and coach_channel_id columns
```

### 2. Start the Bot

You have two options:

#### Option A: Via API (Recommended)

1. Make sure your Next.js server is running: `npm run dev`
2. Call the start endpoint:
   ```bash
   POST http://localhost:3000/api/discord/bot/start
   Content-Type: application/json
   
   {
     "community_id": "your-community-uuid",
     "coach_channel_name": "Coach"
   }
   ```

   This will:
   - Create the "Landing Zone Coach" role
   - Create the Coach voice channel
   - Start monitoring for that community

#### Option B: Via Script (Development)

```bash
npm run bot
```

This starts the bot and registers all communities with `bot_enabled = true`.

### 3. Test the Setup

1. **Check Bot Status**:
   ```bash
   GET http://localhost:3000/api/discord/bot/status?community_id=your-community-uuid
   ```

2. **Verify in Discord**:
   - Check that "Landing Zone Coach" role was created
   - Check that "Coach" voice channel was created (should be hidden from non-coaches)

3. **Test Coach Authorization**:
   - Set a coaching rate in your profile
   - You should automatically receive the coach role
   - You should now see the Coach voice channel

4. **Test Session Creation**:
   - Join the Coach voice channel
   - Bot should create a temporary channel: `💰 $X/hr - YourName`
   - Have someone join your temporary channel
   - Session tracking should begin automatically

## Troubleshooting

### Bot Not Starting

- Check bot token is correct: `echo $DISCORD_BOT_TOKEN`
- Verify bot is online in Discord
- **Verify bot has Administrator permissions (permission integer: 8)**
- Check bot's role is high enough in Discord role hierarchy
- Review server logs for errors

### Role/Channel Not Created

- **Verify bot has Administrator permissions (permission integer: 8)**
- Check bot's role is high enough in Discord role hierarchy (should be near the top)
- Ensure bot has "Server Members Intent" enabled
- Verify bot is online and connected to Discord
- Check that the bot was invited with the correct permissions

### Coach Role Not Assigned

- Verify Discord account is linked to Landing Zone profile
- Check coaching rate is set in profile
- Verify user is a member of the community
- Check bot logs for assignment errors

### Can't See Coach Channel

- Verify you have the "Landing Zone Coach" role
- Check channel permissions in Discord
- Try refreshing Discord client

## Next Steps

Once the bot is working:

1. **Set up multiple communities**: Each community can have its own Coach channel
2. **Monitor sessions**: Check `/api/call-sessions` for active sessions
3. **Review billing**: Sessions are automatically tracked for billing

## API Endpoints Reference

- `POST /api/discord/bot/start` - Start bot for a community
- `POST /api/discord/bot/stop` - Stop bot for a community  
- `GET /api/discord/bot/status` - Check bot status
- `POST /api/discord/bot/assign-role` - Manually assign/remove coach role
