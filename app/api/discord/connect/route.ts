import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Discord OAuth URL - this would need to be configured with your Discord app
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/discord/callback`;
    // Required scopes:
    // - identify: Basic user info (username, avatar, Discord ID)
    // - email: User's email address (requires verified email on Discord)
    // - guilds: List of servers/guilds user is member of
    // - guilds.members.read: Detailed membership info (roles, nicknames) for verifying server membership
    const scopes = ['identify', 'email', 'guilds', 'guilds.members.read'];

    if (!clientId) {
      console.error('DISCORD_CLIENT_ID environment variable is not set');
      return NextResponse.json(
        { error: 'Discord OAuth not configured. Please set DISCORD_CLIENT_ID environment variable.' },
        { status: 500 }
      );
    }

    const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%20')}&state=${user.id}`;

    return NextResponse.json({ url: discordOAuthUrl });
  } catch (error: any) {
    console.error('Discord connect API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
