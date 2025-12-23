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
      .from('endorsements')
      .select(`
        *,
        endorser:profiles!endorsements_endorser_profile_id_fkey(id, name, avatar_url),
        skill:skills(id, skill_type:skill_types(name))
      `)
      .eq('endorsee_profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching endorsements:', error);
      return NextResponse.json({ error: 'Failed to fetch endorsements' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Endorsements API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
