import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateBotInviteUrl } from '@/lib/discord/invite';

// Dynamic import to avoid bundling discord.js in client
const getBotInstance = async () => {
  const { getBotInstance } = await import('@/lib/discord/bot');
  return getBotInstance();
};

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { community_id, coach_channel_id } = body;

    if (!community_id) {
      return NextResponse.json(
        { error: 'community_id is required' },
        { status: 400 }
      );
    }

    // coach_channel_id is optional - we'll set it up in a second step

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

    // Get community Discord server ID - try to get from selectedGuild or database
    // For new setups, we need the guild ID from the request
    const { discord_server_id } = body;
    
    let guildId = discord_server_id;
    
    if (!guildId) {
      // Try to get from existing community
      const { data: community } = await supabase
        .from('communities')
        .select('discord_server_id')
        .eq('id', community_id)
        .single();

      if (community?.discord_server_id) {
        guildId = community.discord_server_id;
      }
    }

    if (!guildId) {
      return NextResponse.json(
        { error: 'Discord server ID is required. Please provide discord_server_id in the request.' },
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

    // Get or create bot instance
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

    // Get guild to fetch channel name
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:124',message:'Fetching guild',data:{guildId, botReady:bot.client.isReady(), cachedGuilds:bot.client.guilds.cache.size},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    let guild = bot.client.guilds.cache.get(guildId);
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:127',message:'Guild cache check',data:{foundInCache:!!guild, guildId},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!guild) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:130',message:'Fetching guild from API',data:{guildId},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        guild = await bot.client.guilds.fetch(guildId);
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:133',message:'Guild fetch result',data:{success:!!guild, guildId},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:136',message:'Guild fetch error',data:{error:error?.message, code:error?.code, stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // Generate invite URL if bot is not in server
        const clientId = process.env.DISCORD_CLIENT_ID;
        const inviteUrl = clientId ? generateBotInviteUrl(clientId) : null;
        
        return NextResponse.json(
          { 
            error: 'Bot is not in the server',
            details: 'The Landing Zone bot needs to be added to your Discord server before setup. Please add the bot using the invite link below, then try again.',
            needsReinvite: true,
            inviteUrl: inviteUrl,
          },
          { status: 404 }
        );
      }
    }

    if (!guild) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:147',message:'Guild still null after fetch',data:{guildId},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }

    // Create coach role (channel will be configured in a second step)
    // If coach_channel_id is provided, configure it now; otherwise just create the role
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:170',message:'Starting role setup',data:{guildId, hasCoachChannelId:!!coach_channel_id},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    let setupResult: { roleId: string; channelId: string } | null = null;
    let channelName = 'Coach';

    if (coach_channel_id) {
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

      channelName = channel.name;

      // Create coach role and configure the selected channel
      setupResult = await bot.setupCoachRoleAndChannel(
        guildId,
        community_id,
        coach_channel_id,
        channelName
      );

      if (!setupResult) {
        return NextResponse.json(
          { error: 'Failed to create coach role and channel. Make sure bot has necessary permissions.' },
          { status: 500 }
        );
      }
    } else {
      // Just create the coach role, no channel yet
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:213',message:'Creating coach role only',data:{guildId, community_id},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      setupResult = await bot.setupCoachRoleAndChannel(
        guildId,
        community_id,
        null,
        'Coach'
      );

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:221',message:'Role setup result',data:{success:!!setupResult, roleId:setupResult?.roleId, channelId:setupResult?.channelId},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (!setupResult) {
        return NextResponse.json(
          { error: 'Failed to create coach role. Make sure bot has necessary permissions.' },
          { status: 500 }
        );
      }
    }

    // Register guild with bot
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:229',message:'Registering guild with bot',data:{guildId, community_id, roleId:setupResult.roleId, channelId:setupResult.channelId},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    
    await bot.registerGuild({
      guildId: guildId,
      communityId: community_id,
      coachChannelName: channelName,
      coachRoleId: setupResult.roleId,
      coachChannelId: setupResult.channelId || null,
    });

    // Update community bot configuration - ensure discord_server_id is always saved
    const updateData: any = {
      discord_server_id: guildId,
      bot_enabled: true,
      coach_role_id: setupResult.roleId,
    };

    // Only add channel data if channel was configured
    if (setupResult.channelId) {
      updateData.coach_channel_name = channelName;
      updateData.coach_channel_id = setupResult.channelId;
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:251',message:'Updating database',data:{community_id, updateData},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    const { error: updateError } = await supabase
      .from('communities')
      .update(updateData)
      .eq('id', community_id);

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:257',message:'Database update result',data:{success:!updateError, errorCode:updateError?.code, errorMessage:updateError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    // If bot columns don't exist, at least save discord_server_id
    if (updateError && (updateError.code === '42703' || updateError.code === 'PGRST204')) {
      const simpleUpdate = await supabase
        .from('communities')
        .update({ discord_server_id: guildId })
        .eq('id', community_id);
      
      if (simpleUpdate.error) {
        console.error('Error updating community discord_server_id:', simpleUpdate.error);
      }
    } else if (updateError) {
      console.error('Error updating community bot config:', updateError);
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/start/route.ts:270',message:'Returning success',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'bot-start-1',hypothesisId:'M'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      success: true,
      message: 'Bot started for community',
    });
  } catch (error: any) {
    console.error('Bot start API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
