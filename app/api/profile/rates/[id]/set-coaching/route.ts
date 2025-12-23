import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Dynamic import to avoid bundling discord.js in client
const getBotInstance = async () => {
  const { getBotInstance } = await import('@/lib/discord/bot');
  return getBotInstance();
};

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Verify rate belongs to user
    const { data: rate } = await supabase
      .from('rates')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!rate) {
      return NextResponse.json({ error: 'Rate not found' }, { status: 404 });
    }

    // Update profile coaching_rate_id
    const updateQuery = supabase
      .from('profiles')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update({ coaching_rate_id: id })
      .eq('id', user.id);
    const { error } = await updateQuery;

    if (error) {
      console.error('Error setting coaching rate:', error);
      return NextResponse.json({ error: 'Failed to set coaching rate' }, { status: 500 });
    }

    // Assign coach role in all communities where user is a member and bot is enabled
    const { data: memberships } = await supabase
      .from('community_members')
      .select(`
        community_id,
        community:communities!inner(
          discord_server_id,
          coach_role_id,
          bot_enabled
        )
      `)
      .eq('profile_id', user.id);

    if (memberships) {
      const botToken = process.env.DISCORD_BOT_TOKEN;
      const bot = botToken ? await getBotInstance() : null;

      if (bot && botToken) {
        // Ensure bot is logged in
        if (!bot.client.isReady()) {
          await bot.login(botToken);
        }

        // Get Discord user ID
        const { data: discordUser } = await supabase
          .from('discord_users')
          .select('discord_user_id')
          .eq('profile_id', user.id)
          .single();

        if (discordUser) {
          // Assign role in each community
          for (const membership of memberships) {
            const typedMembership = membership as { community_id: string; community: { bot_enabled: boolean; discord_server_id: string | null; coach_role_id: string | null } };
            const community = typedMembership.community;
            if (
              community.bot_enabled &&
              community.discord_server_id &&
              community.coach_role_id
            ) {
              try {
                  await bot.assignCoachRole(
                    community.discord_server_id!,
                    (discordUser as { discord_user_id: string }).discord_user_id,
                    community.coach_role_id!
                  );
              } catch (error) {
                console.error(`Failed to assign coach role in community ${typedMembership.community_id}:`, error);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set coaching rate API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
