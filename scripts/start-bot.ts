#!/usr/bin/env ts-node
/**
 * Discord Bot Startup Script
 * 
 * This script starts the Discord bot and registers all communities
 * that have bot_enabled = true
 * 
 * Usage:
 *   npm run bot
 * 
 * Requires environment variables:
 *   - DISCORD_BOT_TOKEN: Discord bot token
 *   - SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { getBotInstance } from '../lib/discord/bot';
import { createServiceRoleClient } from '../lib/supabase/server';

async function startBot() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!botToken) {
    console.error('DISCORD_BOT_TOKEN environment variable is not set');
    process.exit(1);
  }

  console.log('Starting Discord bot...');

  const bot = getBotInstance();
  
  // Login bot
  try {
    await bot.login(botToken);
    console.log('Bot logged in successfully');
  } catch (error) {
    console.error('Failed to login bot:', error);
    process.exit(1);
  }

  // Wait for bot to be ready
  await new Promise((resolve) => {
    const checkReady = () => {
      if (bot.client.isReady()) {
        resolve(undefined);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });

  // Get all communities with bot enabled
  const supabase = createServiceRoleClient();
  const { data: communities, error } = await supabase
    .from('communities')
    .select('id, discord_server_id, coach_channel_name, coach_role_id, coach_channel_id')
    .eq('bot_enabled', true)
    .not('discord_server_id', 'is', null)
    .not('coach_channel_name', 'is', null)
    .not('coach_role_id', 'is', null)
    .not('coach_channel_id', 'is', null);

  if (error) {
    console.error('Error fetching communities:', error);
    process.exit(1);
  }

  if (!communities || communities.length === 0) {
    console.log('No communities with bot enabled found');
    return;
  }

  const typedCommunities = communities as {
    id: string;
    discord_server_id: string;
    coach_channel_name: string;
    coach_role_id: string;
    coach_channel_id: string;
  }[];

  console.log(`Found ${typedCommunities.length} communities with bot enabled`);

  // Register each community
  for (const community of typedCommunities) {
    try {
      await bot.registerGuild({
        guildId: community.discord_server_id!,
        communityId: community.id,
        coachChannelName: community.coach_channel_name!,
        coachRoleId: community.coach_role_id!,
        coachChannelId: community.coach_channel_id!,
      });
      console.log(`Registered community: ${community.id} (Guild: ${community.discord_server_id})`);
    } catch (error) {
      console.error(`Failed to register community ${community.id}:`, error);
    }
  }

  console.log('Bot startup complete. Press Ctrl+C to stop.');

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\nShutting down bot...');
    await bot.logout();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down bot...');
    await bot.logout();
    process.exit(0);
  });
}

startBot().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
