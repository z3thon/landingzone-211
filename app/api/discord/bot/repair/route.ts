import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Repair bot setup - recreate missing role and/or channel
 * POST /api/discord/bot/repair
 * Body: { community_id }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { community_id, discord_server_id } = body;

    if (!community_id) {
      return NextResponse.json(
        { error: 'community_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify user is admin/owner of the community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('profile_id', user.id)
      .eq('community_id', community_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'You must be an admin or owner of this community' },
        { status: 403 }
      );
    }

    // Get community configuration
    // First check if community exists (without bot-specific columns)
    const { data: communityExists, error: existsError } = await supabase
      .from('communities')
      .select('id, discord_server_id')
      .eq('id', community_id)
      .single();

    if (!communityExists) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Try to get full community with bot columns, but handle if columns don't exist
    let community: any = null;
    
    // Try querying with bot columns first
    const resultWithBotColumns = await supabase
      .from('communities')
      .select('discord_server_id, coach_channel_name, coach_role_id, coach_channel_id, bot_enabled')
      .eq('id', community_id)
      .single();
    
    // If columns don't exist (error 42703), query without them
    if (resultWithBotColumns.error && (resultWithBotColumns.error.code === '42703' || resultWithBotColumns.error.message?.includes('does not exist'))) {
      const resultWithoutBotColumns = await supabase
        .from('communities')
        .select('discord_server_id')
        .eq('id', community_id)
        .single();
      
      community = resultWithoutBotColumns.data;
      // Set defaults for missing columns
      if (community) {
        community.coach_channel_name = null;
        community.coach_role_id = null;
        community.coach_channel_id = null;
        community.bot_enabled = false;
      }
    } else {
      // Use the result with bot columns
      community = resultWithBotColumns.data;
    }

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Use provided discord_server_id or existing one, or fail if neither exists
    const guildId = discord_server_id || community.discord_server_id;
    
    if (!guildId) {
      return NextResponse.json(
        { error: 'Community does not have a Discord server configured. Please set up the bot first.' },
        { status: 400 }
      );
    }

    // Update discord_server_id if it was provided and different
    if (discord_server_id && discord_server_id !== community.discord_server_id) {
      const { error: updateError } = await supabase
        .from('communities')
        .update({ discord_server_id: discord_server_id })
        .eq('id', community_id);

      if (updateError) {
        console.error('Error updating discord_server_id:', updateError);
      }
    }

    // Note: We allow repair even if bot_enabled is false - repair is meant to fix/re-enable the bot
    // This handles cases where the bot was kicked and needs to be re-invited

    // Check if bot token is configured
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

    // Dynamic import to avoid bundling discord.js in client
    const getBotInstance = async () => {
      const { getBotInstance } = await import('@/lib/discord/bot');
      return getBotInstance();
    };

    // Get bot instance
    const bot = await getBotInstance();

    // Ensure bot is logged in
    if (!bot.client.isReady()) {
      try {
        await bot.login(botToken);
      } catch (loginError: any) {
        // Check if it's an intents error
        if (loginError?.message?.includes('disallowed intents') || loginError?.code === 4014) {
          return NextResponse.json(
            {
              error: 'Bot requires Server Members Intent',
              details: 'The bot needs the "Server Members Intent" enabled in the Discord Developer Portal. Please go to https://discord.com/developers/applications, select your bot, go to the "Bot" section, scroll down to "Privileged Gateway Intents", and enable "SERVER MEMBERS INTENT". Then try again.',
              needsIntent: true,
            },
            { status: 400 }
          );
        }
        
        throw loginError;
      }
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

    // Repair setup
    const repairResult = await bot.repairSetup(
      guildId,
      community_id,
      community.coach_channel_name || 'Coach',
      community.coach_role_id,
      community.coach_channel_id
    );

    if (!repairResult) {
      // Check if bot is in the server
      const guild = bot.client.guilds.cache.get(guildId);
      if (!guild) {
        // Generate invite URL
        const clientId = process.env.DISCORD_CLIENT_ID;
        const inviteUrl = clientId 
          ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot`
          : null;
        
        return NextResponse.json(
          { 
            error: 'Bot is not in the Discord server. Please re-invite the bot with Administrator permissions, then try repair again.',
            needsReinvite: true,
            inviteUrl: inviteUrl
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to repair bot setup. Make sure bot has necessary permissions.' },
        { status: 500 }
      );
    }

    // Update community configuration with repaired IDs and ensure discord_server_id is set
    // Build update object - only include columns that exist
    const updateData: any = {
      discord_server_id: guildId,
    };
    
    // Try to update bot columns if they exist
    const updateResult = await supabase
      .from('communities')
      .update({
        discord_server_id: guildId,
        coach_role_id: repairResult.roleId,
        coach_channel_id: repairResult.channelId,
        bot_enabled: true,
      })
      .eq('id', community_id);
    
    // If columns don't exist (PostgreSQL 42703 or Supabase PGRST204), just update discord_server_id
    const isColumnMissingError = updateResult.error && (
      updateResult.error.code === '42703' || 
      updateResult.error.code === 'PGRST204' ||
      updateResult.error.message?.includes('does not exist') ||
      updateResult.error.message?.includes('Could not find')
    );
    
    if (isColumnMissingError) {
      const simpleUpdate = await supabase
        .from('communities')
        .update({ discord_server_id: guildId })
        .eq('id', community_id);
      
      if (simpleUpdate.error) {
        console.error('Error updating community after repair:', simpleUpdate.error);
        // Even if update fails, return success since Discord repair worked
        // The user can try repair again or manually fix the database
        return NextResponse.json({
          success: true,
          message: 'Bot setup repaired successfully in Discord, but database update failed. Please try repair again or check database connection.',
          role_id: repairResult.roleId,
          channel_id: repairResult.channelId,
          warning: 'Database update failed',
        });
      }
      
      // Success but columns don't exist - repair worked in Discord, but database migration needed
      return NextResponse.json({
        success: true,
        message: 'Bot setup repaired successfully in Discord. Note: Database migration may need to be applied to store bot configuration.',
        role_id: repairResult.roleId,
        channel_id: repairResult.channelId,
        needsMigration: true,
      });
    } else if (updateResult.error) {
      console.error('Error updating community after repair:', updateResult.error);
      return NextResponse.json(
        { error: 'Repaired but failed to update database' },
        { status: 500 }
      );
    }

    // Re-register guild with updated config
    await bot.registerGuild({
      guildId: guildId,
      communityId: community_id,
      coachChannelName: community.coach_channel_name || 'Coach',
      coachRoleId: repairResult.roleId,
      coachChannelId: repairResult.channelId,
    });

    return NextResponse.json({
      success: true,
      message: 'Bot setup repaired successfully',
      role_id: repairResult.roleId,
      channel_id: repairResult.channelId,
    });
  } catch (error: any) {
    console.error('Repair bot API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
