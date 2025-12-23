import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Get voice channels for a Discord guild using bot token
 * Note: Discord's GET /guilds/{id}/channels endpoint requires bot authentication,
 * not OAuth2 user tokens. User tokens can only access /users/@me/guilds.
 * GET /api/discord/channels?guild_id=...
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guild_id');

    if (!guildId) {
      return NextResponse.json(
        { error: 'guild_id is required' },
        { status: 400 }
      );
    }

    // Use bot token instead of user OAuth token
    // Discord's GET /guilds/{id}/channels endpoint requires bot authentication
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ 
        error: 'Discord bot token not configured',
        code: 'BOT_TOKEN_MISSING',
      }, { status: 500 });
    }

    // Verify user is a member of the guild using their OAuth token
    const supabase = createServiceRoleClient();
    const { data: discordUser } = await supabase
      .from('discord_users')
      .select('access_token')
      .eq('profile_id', user.id)
      .single();

    if (discordUser && (discordUser as { access_token: string | null }).access_token) {
      // Check if user is a member of the guild
      const typedDiscordUser = discordUser as { access_token: string };
      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${typedDiscordUser.access_token}`,
        },
      });

      if (guildsResponse.ok) {
        const userGuilds = await guildsResponse.json();
        const isMember = Array.isArray(userGuilds) && userGuilds.some((g: any) => g.id === guildId);
        
        if (!isMember) {
          return NextResponse.json({ 
            error: 'You are not a member of this Discord server. Please join the server first.',
            code: 'NOT_MEMBER',
          }, { status: 403 });
        }
      }
    }

    // Fetch channels using bot token
    const channelsResponse = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!channelsResponse.ok) {
      const errorText = await channelsResponse.text();
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use text as-is
      }
      
      console.error('Discord API error:', {
        status: channelsResponse.status,
        statusText: channelsResponse.statusText,
        error: errorText,
        errorJson,
      });
      
      if (channelsResponse.status === 401) {
        return NextResponse.json({ 
          error: 'Bot is not authorized to access this server. Make sure the bot is added to the server.',
          details: errorJson?.message || 'Unauthorized',
          code: 'BOT_UNAUTHORIZED',
        }, { status: 401 });
      }
      
      if (channelsResponse.status === 403) {
        return NextResponse.json({ 
          error: 'Bot does not have permission to view channels in this server.',
          details: errorJson?.message || 'Forbidden',
          code: 'BOT_PERMISSION_DENIED',
        }, { status: 403 });
      }
      
      if (channelsResponse.status === 404) {
        return NextResponse.json({ 
          error: 'Server not found or bot is not in the server.',
          code: 'GUILD_NOT_FOUND',
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch Discord channels',
        code: 'DISCORD_API_ERROR',
      }, { status: 500 });
    }

    let channels;
    try {
      channels = await channelsResponse.json();
    } catch (error) {
      console.error('Error parsing Discord response:', error);
      return NextResponse.json({ error: 'Invalid response from Discord API' }, { status: 500 });
    }
    
    // Ensure channels is an array
    if (!Array.isArray(channels)) {
      console.error('Discord API returned non-array:', channels);
      return NextResponse.json({ error: 'Invalid channels data format' }, { status: 500 });
    }

    // Filter for voice channels (type 2) and organize by category
    const voiceChannels = channels
      .filter((channel: any) => channel.type === 2) // GuildVoice = 2
      .map((channel: any) => {
        // Find parent category if exists
        const parent = channel.parent_id 
          ? channels.find((c: any) => c.id === channel.parent_id && c.type === 4) // GuildCategory = 4
          : null;
        
        return {
          id: channel.id,
          name: channel.name,
          parent: parent ? {
            id: parent.id,
            name: parent.name,
          } : null,
        };
      })
      .sort((a, b) => {
        // Sort by category name first, then channel name
        if (a.parent && b.parent) {
          if (a.parent.name !== b.parent.name) {
            return a.parent.name.localeCompare(b.parent.name);
          }
        } else if (a.parent) {
          return -1;
        } else if (b.parent) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      success: true,
      channels: voiceChannels,
    });
  } catch (error: any) {
    console.error('Get channels API error:', error);
    // Don't expose internal error details to client
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
