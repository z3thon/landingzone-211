import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Dynamic import to avoid bundling discord.js in client
const getBotInstance = async () => {
  const { getBotInstance } = await import('@/lib/discord/bot');
  return getBotInstance();
};

export const runtime = 'nodejs';

/**
 * Update coach channel for a community
 * POST /api/discord/bot/update-channel
 * Body: { community_id, coach_channel_id }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { community_id, coach_channel_id, discord_server_id } = body;

    if (!community_id) {
      return NextResponse.json(
        { error: 'community_id is required' },
        { status: 400 }
      );
    }

    if (!coach_channel_id) {
      return NextResponse.json(
        { error: 'coach_channel_id is required' },
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

    if (!membership || !['owner', 'admin'].includes((membership as { role: string }).role)) {
      return NextResponse.json(
        { error: 'You must be an admin or owner of this community' },
        { status: 403 }
      );
    }

    // Get community Discord server ID (use provided discord_server_id or get from database)
    let guildId = discord_server_id;
    let coachRoleId: string | null = null;
    
    // Try querying with bot columns first, fall back if they don't exist
    let communityData: any = null;
    let queryError: any = null;
    
    try {
      const result = await supabase
        .from('communities')
        .select('discord_server_id, coach_role_id')
        .eq('id', community_id)
        .single();
      
      communityData = result.data;
      queryError = result.error;
    } catch (error: any) {
      queryError = error;
    }

    // If columns don't exist, try querying without them
    if (queryError && (queryError.code === '42703' || queryError.code === 'PGRST204' || queryError.code === 'PGRST116')) {
      const resultWithoutBotColumns = await supabase
        .from('communities')
        .select('discord_server_id')
        .eq('id', community_id)
        .single();
      
      communityData = resultWithoutBotColumns.data;
      queryError = resultWithoutBotColumns.error;
      
      if (communityData) {
        communityData.coach_role_id = null;
      }
    }

    if (!communityData) {
      // Check if it's a "not found" error - if so, try to create the community
      if (queryError && (queryError.code === 'PGRST116' || queryError.message?.includes('No rows'))) {
        // Community doesn't exist - we need guild info to create it
        if (!guildId) {
          return NextResponse.json(
            { error: 'Community not found. Please set up the bot first using the "Set Up Now" button.' },
            { status: 404 }
          );
        }
        
        // Get guild name from Discord (we'll initialize bot later if needed)
        let guildName = 'Discord Community';
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (botToken) {
          try {
            const bot = await getBotInstance();
            if (!bot.client.isReady()) {
              await bot.login(botToken);
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
            }
            
            let guild = bot.client.guilds.cache.get(guildId);
            if (!guild) {
              guild = await bot.client.guilds.fetch(guildId);
            }
            if (guild) {
              guildName = guild.name;
            }
          } catch (e) {
            console.error('Error fetching guild name:', e);
          }
        }
        
        // Create the community
        const insertQuery = supabase
          .from('communities')
          // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
          .insert({
            id: community_id,
            name: guildName,
            discord_server_id: guildId,
          })
          .select('discord_server_id')
          .single();
        const createResult = await insertQuery;
        
        if (createResult.error && createResult.error.code !== '23505') { // 23505 = duplicate key (already exists)
          console.error('Error creating community:', createResult.error);
          return NextResponse.json(
            { error: 'Failed to create community in database', code: 'DATABASE_ERROR' },
            { status: 500 }
          );
        }
        
        // Use the created data or set defaults
        communityData = createResult.data || { discord_server_id: guildId, coach_role_id: null };
      } else {
        // For other errors, still return not found but log the error
        console.error('Error querying community:', queryError);
        return NextResponse.json(
          { error: 'Community not found or database error', code: 'DATABASE_ERROR' },
          { status: 404 }
        );
      }
    }

    // Use provided guildId or get from database
    if (!guildId) {
      guildId = communityData.discord_server_id;
    }

    coachRoleId = communityData.coach_role_id;
    
    // If still no guild ID, try to update it from the provided discord_server_id
    if (!guildId && discord_server_id) {
      guildId = discord_server_id;
      // Save it to the database
      const updateQuery = supabase
        .from('communities')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ discord_server_id: discord_server_id })
        .eq('id', community_id);
      await updateQuery;
    }

    if (!guildId) {
      return NextResponse.json(
        { error: 'Community does not have a Discord server configured. Please provide discord_server_id or repair the bot setup first.' },
        { status: 400 }
      );
    }

    // Check if bot token is configured
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

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
              details: 'The bot needs the "Server Members Intent" enabled in the Discord Developer Portal.',
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

    // Get guild
    let guild = bot.client.guilds.cache.get(guildId);
    if (!guild) {
      try {
        guild = await bot.client.guilds.fetch(guildId);
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Guild not found or bot is not in the server' },
          { status: 404 }
        );
      }
    }

    if (!guild) {
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }

    // Verify the channel exists and is a voice channel
    let channel = guild.channels.cache.get(coach_channel_id);
    if (!channel) {
      try {
        channel = await guild.channels.fetch(coach_channel_id) as any;
      } catch (error) {
        return NextResponse.json(
          { error: 'Channel not found' },
          { status: 404 }
        );
      }
    }

    if (!channel || channel.type !== 2) { // ChannelType.GuildVoice = 2
      return NextResponse.json(
        { error: 'Selected channel is not a voice channel' },
        { status: 400 }
      );
    }

    // Get or create coach role
    let coachRole = coachRoleId 
      ? guild.roles.cache.get(coachRoleId)
      : null;

    if (!coachRole) {
      coachRole = guild.roles.cache.find(role => role.name === 'Landing Zone Coach');
      if (!coachRole) {
        coachRole = await guild.roles.create({
          name: 'Landing Zone Coach',
          color: 0x00ff00,
          mentionable: false,
          reason: 'Landing Zone coach role',
        });
      }
    }

    // Update channel permissions
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
        ViewChannel: false,
        Connect: false,
      });
      await channel.permissionOverwrites.edit(coachRole.id, {
        ViewChannel: true,
        Connect: true,
      });
    } catch (permError: any) {
      throw permError;
    }

    // Update database - ensure discord_server_id and coach_channel_id are saved
    const updateData: any = {
      discord_server_id: guildId,
      coach_channel_id: coach_channel_id,
      coach_channel_name: channel.name,
      coach_role_id: coachRole.id,
      bot_enabled: true,
    };

    // Update with bot columns (migration should be applied now)
    const updateQuery = supabase
      .from('communities')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(updateData)
      .eq('id', community_id);
    const updateResult = await updateQuery;

    // Handle missing columns gracefully (fallback if migration not applied)
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.code === 'PGRST204')) {
      // Columns don't exist - at least save discord_server_id
      const simpleUpdateQuery = supabase
        .from('communities')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ discord_server_id: guildId })
        .eq('id', community_id);
      const simpleUpdate = await simpleUpdateQuery;
      
      if (simpleUpdate.error) {
        console.error('Error updating discord_server_id:', simpleUpdate.error);
      }
      console.warn('Bot columns not found in database - migration may need to be applied');
    } else if (updateResult.error) {
      console.error('Error updating community:', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to update database', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Update bot configuration (for in-memory access)
    await bot.registerGuild({
      guildId: guildId,
      communityId: community_id,
      coachChannelName: channel.name,
      coachRoleId: coachRole.id,
      coachChannelId: coach_channel_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Coach channel updated successfully',
      channel_id: coach_channel_id,
      channel_name: channel.name,
    });
  } catch (error: any) {
    console.error('Update channel API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
