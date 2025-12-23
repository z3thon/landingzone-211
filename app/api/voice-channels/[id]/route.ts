import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const body = await request.json();
    const { channel_name, billing_rate_per_hour, active } = body;

    const supabase = createServiceRoleClient();

    // Verify voice channel belongs to user
    const { data: channel } = await supabase
      .from('voice_channels')
      .select('id')
      .eq('id', id)
      .eq('coach_profile_id', user.id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Voice channel not found' }, { status: 404 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (channel_name) updateData.channel_name = channel_name;
    if (billing_rate_per_hour !== undefined) updateData.billing_rate_per_hour = parseFloat(billing_rate_per_hour);
    if (active !== undefined) updateData.active = active;

    const updateQuery = supabase
      .from('voice_channels')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        community:communities(id, name, logo_url)
      `)
      .single();
    const { data, error } = await updateQuery;

    if (error) {
      console.error('Error updating voice channel:', error);
      return NextResponse.json({ error: 'Failed to update voice channel' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update voice channel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify voice channel belongs to user
    const { data: channel } = await supabase
      .from('voice_channels')
      .select('id')
      .eq('id', id)
      .eq('coach_profile_id', user.id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Voice channel not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('voice_channels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting voice channel:', error);
      return NextResponse.json({ error: 'Failed to delete voice channel' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete voice channel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
