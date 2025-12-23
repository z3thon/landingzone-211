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
    
    const { data, error } = await supabase
      .from('voice_channels')
      .select(`
        *,
        community:communities(id, name, logo_url)
      `)
      .eq('coach_profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching voice channels:', error);
      return NextResponse.json({ error: 'Failed to fetch voice channels' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Voice channels API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { community_id, discord_channel_id, channel_name, billing_rate_per_hour } = body;

    if (!community_id || !discord_channel_id || !channel_name || billing_rate_per_hour === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify user is member of community
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('profile_id', user.id)
      .eq('community_id', community_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this community' },
        { status: 403 }
      );
    }

    const insertQuery = supabase
      .from('voice_channels')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .insert({
        community_id,
        discord_channel_id,
        channel_name,
        coach_profile_id: user.id,
        billing_rate_per_hour: parseFloat(billing_rate_per_hour),
        active: true,
      })
      .select(`
        *,
        community:communities(id, name, logo_url)
      `)
      .single();
    const { data, error } = await insertQuery;

    if (error) {
      console.error('Error creating voice channel:', error);
      return NextResponse.json({ error: 'Failed to create voice channel' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create voice channel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
