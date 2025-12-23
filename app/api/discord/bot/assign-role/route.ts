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
 * Assign or remove coach role from a Discord user
 * POST /api/discord/bot/assign-role
 * Body: { community_id, profile_id, assign: true/false }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { community_id, profile_id, assign } = body;

    if (!community_id || !profile_id || typeof assign !== 'boolean') {
      return NextResponse.json(
        { error: 'community_id, profile_id, and assign (boolean) are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify user is admin/owner of the community OR updating their own profile
    const isOwnProfile = profile_id === user.id;
    
    if (!isOwnProfile) {
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
    }

    // Get community Discord server ID and coach role ID
    const { data: community } = await supabase
      .from('communities')
      .select('discord_server_id, coach_role_id')
      .eq('id', community_id)
      .single();

    if (!community || !community.discord_server_id) {
      return NextResponse.json(
        { error: 'Community does not have a Discord server configured' },
        { status: 400 }
      );
    }

    if (!community.coach_role_id) {
      return NextResponse.json(
        { error: 'Coach role not set up for this community. Please start the bot first.' },
        { status: 400 }
      );
    }

    // Get Discord user ID for the profile
    const { data: discordUser } = await supabase
      .from('discord_users')
      .select('discord_user_id')
      .eq('profile_id', profile_id)
      .single();

    if (!discordUser) {
      return NextResponse.json(
        { error: 'Profile does not have a linked Discord account' },
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
      await bot.login(botToken);
    }

    // Assign or remove role
    let success = false;
    if (assign) {
      success = await bot.assignCoachRole(
        community.discord_server_id,
        discordUser.discord_user_id,
        community.coach_role_id
      );
    } else {
      success = await bot.removeCoachRole(
        community.discord_server_id,
        discordUser.discord_user_id,
        community.coach_role_id
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${assign ? 'assign' : 'remove'} coach role` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Coach role ${assign ? 'assigned' : 'removed'} successfully`,
    });
  } catch (error: any) {
    console.error('Assign role API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
