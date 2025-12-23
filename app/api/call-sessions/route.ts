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
    const attendeeId = searchParams.get('attendee_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createServiceRoleClient();
    
    // Get call sessions where user is coach or attendee
    let query = supabase
      .from('call_sessions')
      .select(`
        *,
        coach_profile:profiles!call_sessions_coach_profile_id_fkey(id, name, avatar_url),
        attendee_profile:profiles!call_sessions_attendee_profile_id_fkey(id, name, avatar_url),
        voice_channel:voice_channels(
          id,
          channel_name,
          community:communities(id, name)
        )
      `)
      .or(`coach_profile_id.eq.${user.id},attendee_profile_id.eq.${user.id}`);

    if (status) {
      query = query.eq('status', status);
    }

    if (attendeeId) {
      query = query.eq('attendee_profile_id', attendeeId);
    }

    if (startDate) {
      query = query.gte('started_at', startDate);
    }

    if (endDate) {
      query = query.lte('started_at', endDate);
    }

    const { data, error } = await query.order('started_at', { ascending: false }).limit(100);

    if (error) {
      console.error('Error fetching call sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch call sessions' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Call sessions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
