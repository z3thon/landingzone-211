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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      rate_type_id,
      rate_per_hour,
      currency,
      start_date,
      end_date,
      memo,
      status,
    } = body;

    const supabase = createServiceRoleClient();

    // Verify rate belongs to user
    const { data: rate } = await supabase
      .from('rates')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', user.id)
      .single();

    if (!rate) {
      return NextResponse.json({ error: 'Rate not found' }, { status: 404 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (rate_type_id) updateData.rate_type_id = rate_type_id;
    if (rate_per_hour !== undefined) updateData.rate_per_hour = parseFloat(rate_per_hour);
    if (currency) updateData.currency = currency;
    if (start_date) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (memo !== undefined) updateData.memo = memo;
    if (status) updateData.status = status;

    const { data, error } = await supabase
      .from('rates')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        rate_type:rate_types(id, name, description)
      `)
      .single();

    if (error) {
      console.error('Error updating rate:', error);
      return NextResponse.json({ error: 'Failed to update rate' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update rate API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Verify rate belongs to user
    const { data: rate } = await supabase
      .from('rates')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', user.id)
      .single();

    if (!rate) {
      return NextResponse.json({ error: 'Rate not found' }, { status: 404 });
    }

    // Archive instead of delete (soft delete)
    const { error } = await supabase
      .from('rates')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) {
      console.error('Error archiving rate:', error);
      return NextResponse.json({ error: 'Failed to archive rate' }, { status: 500 });
    }

    // Remove from profile if it was default or coaching
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_rate_id, coaching_rate_id')
      .eq('id', user.id)
      .single();

    const updates: any = {};
    if (profile?.default_rate_id === params.id) {
      updates.default_rate_id = null;
    }
    if (profile?.coaching_rate_id === params.id) {
      updates.coaching_rate_id = null;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }

    // If coaching rate was removed, remove coach role from all communities
    if (profile?.coaching_rate_id === params.id) {
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
            // Remove role from each community
            for (const membership of memberships) {
              const community = membership.community as any;
              if (
                community.bot_enabled &&
                community.discord_server_id &&
                community.coach_role_id
              ) {
                try {
                  await bot.removeCoachRole(
                    community.discord_server_id,
                    discordUser.discord_user_id,
                    community.coach_role_id
                  );
                } catch (error) {
                  console.error(`Failed to remove coach role in community ${membership.community_id}:`, error);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rate API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
