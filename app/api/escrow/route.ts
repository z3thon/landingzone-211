import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = createServiceRoleClient();
    
    // Get escrow holdings for call sessions where user is coach
    let query = supabase
      .from('escrow_holdings')
      .select(`
        *,
        call_session:call_sessions(
          id,
          coach_profile_id,
          attendee_profile:profiles!call_sessions_attendee_profile_id_fkey(id, name, avatar_url),
          duration_minutes,
          total_cost,
          started_at,
          ended_at
        )
      `)
      .eq('call_session.coach_profile_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching escrow holdings:', error);
      return NextResponse.json({ error: 'Failed to fetch escrow holdings' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Escrow API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
