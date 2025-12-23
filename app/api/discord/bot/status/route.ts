import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Dynamic import to avoid bundling discord.js in client
const getBotInstance = async () => {
  const { getBotInstance } = await import('@/lib/discord/bot');
  return getBotInstance();
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const community_id = searchParams.get('community_id');

    const supabase = createServiceRoleClient();

    if (community_id) {
      // Get status for specific community
      // Try with bot columns first, fall back if they don't exist
      let community: any = null;
      try {
        const result = await supabase
          .from('communities')
          .select('id, name, bot_enabled, coach_channel_name, coach_role_id, coach_channel_id, discord_server_id')
          .eq('id', community_id)
          .single();
        community = result.data;
      } catch (error: any) {
        // If columns don't exist, query without them
        if (error?.code === '42703' || error?.message?.includes('does not exist')) {
          const result = await supabase
            .from('communities')
            .select('id, name, discord_server_id')
            .eq('id', community_id)
            .single();
          community = result.data;
          if (community) {
            community.bot_enabled = false;
            community.coach_channel_name = null;
            community.coach_role_id = null;
            community.coach_channel_id = null;
          }
        }
      }

      if (!community) {
        return NextResponse.json(
          { error: 'Community not found' },
          { status: 404 }
        );
      }

      // Check health if bot is enabled, and get config from bot if database doesn't have it
      let health: { healthy: boolean; issues: string[] } | null = null;
      let coachChannelId = community.coach_channel_id;
      let coachChannelName = community.coach_channel_name;
      let coachRoleId = community.coach_role_id;
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/status/route.ts:61',message:'Starting status check',data:{community_id, bot_enabled:community.bot_enabled, hasDiscordServerId:!!community.discord_server_id, hasRoleId:!!coachRoleId, hasChannelId:!!coachChannelId},timestamp:Date.now(),sessionId:'debug-session',runId:'status-1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // Always check health if bot_enabled is true, even if bot isn't ready
      if (community.bot_enabled && community.discord_server_id) {
        try {
          const botToken = process.env.DISCORD_BOT_TOKEN;
          if (botToken) {
            const bot = await getBotInstance();
            
            // Ensure bot is logged in and ready before checking health
            if (!bot.client.isReady()) {
              try {
                await bot.login(botToken);
                // Wait for bot to be ready (with timeout)
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error('Bot login timeout'));
                  }, 5000);
                  
                  const checkReady = () => {
                    if (bot.client.isReady()) {
                      clearTimeout(timeout);
                      resolve(undefined);
                    } else {
                      setTimeout(checkReady, 100);
                    }
                  };
                  checkReady();
                });
              } catch (loginError: any) {
                // If login fails, mark as unhealthy
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/status/route.ts:95',message:'Bot login failed in status check',data:{error:loginError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'status-1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                health = { healthy: false, issues: ['Bot login failed: ' + (loginError?.message || 'Unknown error')] };
              }
            }
            
            // If database doesn't have channel ID, try to get it from bot's in-memory config
            if (!coachChannelId && bot.client.isReady()) {
              const botConfig = bot.getGuildConfig(community.discord_server_id);
              if (botConfig) {
                coachChannelId = botConfig.coachChannelId;
                coachChannelName = botConfig.coachChannelName;
                coachRoleId = botConfig.coachRoleId;
              }
            }
            
            // Always run health check if bot is enabled, even if not ready (will return unhealthy)
            if (bot.client.isReady()) {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/status/route.ts:109',message:'Checking bot health',data:{guildId:community.discord_server_id, roleId:coachRoleId, channelId:coachChannelId},timestamp:Date.now(),sessionId:'debug-session',runId:'status-1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              
              health = await bot.checkHealth(
                community.discord_server_id,
                coachRoleId,
                coachChannelId
              );
              
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/status/route.ts:116',message:'Health check result',data:{healthy:health?.healthy, issues:health?.issues},timestamp:Date.now(),sessionId:'debug-session',runId:'status-1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            } else {
              // Bot is enabled but not ready - mark as unhealthy
              health = { healthy: false, issues: ['Bot is not connected'] };
            }
          } else {
            health = { healthy: false, issues: ['Bot token not configured'] };
          }
        } catch (error: any) {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/status/route.ts:123',message:'Exception in health check',data:{error:error?.message, stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'status-1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('Error checking bot health:', error);
          health = { healthy: false, issues: ['Error checking bot health: ' + (error?.message || 'Unknown error')] };
        }
      } else if (community.bot_enabled) {
        // Bot is enabled but no discord_server_id - mark as unhealthy
        health = { healthy: false, issues: ['Discord server not configured'] };
      }

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/discord/bot/status/route.ts:145',message:'Returning status response',data:{community_id:community.id, bot_enabled:community.bot_enabled, hasHealth:!!health, healthHealthy:health?.healthy, healthIssues:health?.issues},timestamp:Date.now(),sessionId:'debug-session',runId:'status-1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion

      return NextResponse.json({
        community_id: community.id,
        community_name: community.name,
        bot_enabled: community.bot_enabled || false,
        coach_channel_name: coachChannelName,
        coach_role_id: coachRoleId,
        coach_channel_id: coachChannelId,
        discord_server_id: community.discord_server_id,
        health, // This should always be set if bot_enabled is true
      });
    } else {
      // Get all communities user is admin/owner of
      const { data: communities } = await supabase
        .from('community_members')
        .select(
          `
          role,
          community:communities(
            id,
            name,
            bot_enabled,
            coach_channel_name,
            coach_role_id,
            coach_channel_id,
            discord_server_id
          )
        `
        )
        .eq('profile_id', user.id)
        .in('role', ['owner', 'admin']);

      if (!communities) {
        return NextResponse.json([]);
      }

      // Check health for each community
      const communitiesWithHealth = await Promise.all(
        communities.map(async (cm: any) => {
          let health = null;
          const community = cm.community;
          
          // Ensure bot columns exist (set defaults if migration not applied)
          if (!community.hasOwnProperty('bot_enabled')) {
            community.bot_enabled = false;
          }
          if (!community.hasOwnProperty('coach_channel_name')) {
            community.coach_channel_name = null;
          }
          if (!community.hasOwnProperty('coach_role_id')) {
            community.coach_role_id = null;
          }
          if (!community.hasOwnProperty('coach_channel_id')) {
            community.coach_channel_id = null;
          }
          
          if (community.bot_enabled && community.discord_server_id) {
            try {
              const botToken = process.env.DISCORD_BOT_TOKEN;
              if (botToken) {
                const bot = await getBotInstance();
                if (bot.client.isReady()) {
                  health = await bot.checkHealth(
                    community.discord_server_id,
                    community.coach_role_id,
                    community.coach_channel_id
                  );
                } else {
                  health = { healthy: false, issues: ['Bot is not connected'] };
                }
              } else {
                health = { healthy: false, issues: ['Bot token not configured'] };
              }
            } catch (error) {
              console.error(`Error checking health for community ${community.id}:`, error);
              health = { healthy: false, issues: ['Error checking bot health'] };
            }
          }

          return {
            community_id: community.id,
            community_name: community.name,
            bot_enabled: community.bot_enabled || false,
            coach_channel_name: community.coach_channel_name,
            coach_role_id: community.coach_role_id,
            coach_channel_id: community.coach_channel_id,
            discord_server_id: community.discord_server_id,
            role: cm.role,
            health,
          };
        })
      );

      return NextResponse.json(communitiesWithHealth);
    }
  } catch (error: any) {
    console.error('Bot status API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
