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
    
    let query = supabase
      .from('payouts')
      .select(`
        *,
        escrow_holding:escrow_holdings(
          id,
          call_session:call_sessions(
            id,
            attendee_profile:profiles!call_sessions_attendee_profile_id_fkey(id, name)
          )
        )
      `)
      .eq('coach_profile_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Payouts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
