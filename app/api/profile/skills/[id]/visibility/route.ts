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
    const { community_id, visible } = body;

    if (!community_id || typeof visible !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Verify skill belongs to user
    const { data: skill } = await supabase
      .from('skills')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Verify user is member of community
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('profile_id', user.id)
      .eq('community_id', community_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 });
    }

    // Upsert visibility setting
    const upsertQuery = supabase
      .from('community_skill_visibility')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .upsert({
        profile_id: user.id,
        community_id,
        skill_id: id,
        visible,
      }, {
        onConflict: 'profile_id,community_id,skill_id',
      })
      .select()
      .single();
    const { data, error } = await upsertQuery;

    if (error) {
      console.error('Error updating visibility:', error);
      return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Visibility API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
