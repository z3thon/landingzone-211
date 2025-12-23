import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { generateBotInviteUrl } from '@/lib/discord/invite';

export const runtime = 'nodejs';

/**
 * Get bot invite URL for a specific guild
 * GET /api/discord/bot/invite-url?guild_id=...
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

    const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Discord bot client ID not configured' },
        { status: 500 }
      );
    }

    // Generate invite URL with guild_id pre-filled
    const permissions = '8'; // Administrator permission
    const scopes = ['bot'];
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes.join('%20')}&guild_id=${guildId}`;

    return NextResponse.json({ inviteUrl });
  } catch (error: any) {
    console.error('Error generating invite URL:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
