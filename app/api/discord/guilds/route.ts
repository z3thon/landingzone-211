import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
    // Get Discord user data with access token
    const { data: discordUser, error: discordError } = await supabase
      .from('discord_users')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (discordError || !discordUser) {
      return NextResponse.json({ 
        error: 'Discord account not connected',
        code: 'NOT_CONNECTED'
      }, { status: 404 });
    }

    // Check if we have an access token
    if (!discordUser.access_token) {
      console.error('Discord user found but no access token:', {
        profile_id: user.id,
        discord_user_id: discordUser.discord_user_id,
        has_refresh_token: !!discordUser.refresh_token,
      });
      return NextResponse.json({ 
        error: 'Discord access token not available. Please reconnect your Discord account through Settings.',
        code: 'NO_ACCESS_TOKEN',
        needsReconnect: true
      }, { status: 400 });
    }

    // Helper function to refresh token
    const refreshDiscordToken = async (refreshToken: string) => {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Discord OAuth not configured');
      }

      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenData = await tokenResponse.json();
      return tokenData;
    };

    // Fetch user's Discord guilds
    let guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${discordUser.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    // If token expired, try refreshing
    if (guildsResponse.status === 401 && discordUser.refresh_token) {
      try {
        console.log('Discord token expired, attempting refresh...');
        const newTokenData = await refreshDiscordToken(discordUser.refresh_token);
        
        // Update stored token
        const { error: updateError } = await supabase
          .from('discord_users')
          .update({
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token || discordUser.refresh_token,
            token_expires_at: newTokenData.expires_in ? new Date(Date.now() + newTokenData.expires_in * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', user.id);

        if (updateError) {
          console.error('Error updating refreshed token:', updateError);
        }

        // Retry with new token
        guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${newTokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return NextResponse.json({ 
          error: 'Discord token expired and refresh failed. Please reconnect your Discord account.',
          details: 'Token refresh error'
        }, { status: 401 });
      }
    }

    if (!guildsResponse.ok) {
      const errorText = await guildsResponse.text();
      console.error('Discord API error:', {
        status: guildsResponse.status,
        statusText: guildsResponse.statusText,
        error: errorText,
        hasToken: !!discordUser.access_token,
        hasRefreshToken: !!discordUser.refresh_token,
      });
      
      if (guildsResponse.status === 401) {
        return NextResponse.json({ 
          error: 'Discord token expired. Please reconnect your Discord account.',
          details: errorText 
        }, { status: 401 });
      }
      return NextResponse.json({ 
        error: 'Failed to fetch Discord guilds',
        details: errorText,
        status: guildsResponse.status
      }, { status: 500 });
    }

    let guilds;
    try {
      guilds = await guildsResponse.json();
    } catch (error) {
      console.error('Error parsing Discord response:', error);
      return NextResponse.json({ error: 'Invalid response from Discord API' }, { status: 500 });
    }
    
    // Ensure guilds is an array
    if (!Array.isArray(guilds)) {
      console.error('Discord API returned non-array:', guilds);
      return NextResponse.json({ error: 'Invalid guilds data format', guilds }, { status: 500 });
    }
    
    // Log for debugging
    console.log('Discord guilds fetched:', {
      count: guilds.length,
      guilds: guilds.map((g: any) => ({ id: g.id, name: g.name }))
    });

    // Get all communities with discord_server_id
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, discord_server_id')
      .not('discord_server_id', 'is', null);

    if (communitiesError) {
      console.error('Error fetching communities:', communitiesError);
    }

    // Create a map of discord_server_id to community
    const communityMap = new Map();
    if (communities) {
      communities.forEach((community) => {
        if (community.discord_server_id) {
          communityMap.set(community.discord_server_id, community);
        }
      });
    }

    // Enrich guilds with Landing Zone installation status
    const enrichedGuilds = guilds.map((guild: any) => {
      const community = communityMap.get(guild.id);
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
        owner: guild.owner,
        permissions: guild.permissions,
        features: guild.features || [],
        hasLandingZone: !!community,
        communityId: community?.id || null,
        communityName: community?.name || null,
      };
    });

    return NextResponse.json({ guilds: enrichedGuilds });
  } catch (error) {
    console.error('Discord guilds API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
