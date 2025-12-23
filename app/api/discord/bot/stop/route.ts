import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { community_id } = body;

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

    // Get community Discord server ID
    const { data: community } = await supabase
      .from('communities')
      .select('discord_server_id')
      .eq('id', community_id)
      .single();

    if (!community || !community.discord_server_id) {
      return NextResponse.json(
        { error: 'Community does not have a Discord server configured' },
        { status: 400 }
      );
    }

    // Get bot instance
    const bot = await getBotInstance();

    // Unregister guild from bot
    await bot.unregisterGuild(community.discord_server_id);

    // Update community bot configuration
    const { error: updateError } = await supabase
      .from('communities')
      .update({
        bot_enabled: false,
      })
      .eq('id', community_id);

    if (updateError) {
      console.error('Error updating community bot config:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Bot stopped for community',
    });
  } catch (error: any) {
    console.error('Bot stop API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
