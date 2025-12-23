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
      .from('discord_users')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Discord status:', error);
      return NextResponse.json({ error: 'Failed to fetch Discord status' }, { status: 500 });
    }

    return NextResponse.json(data || null);
  } catch (error) {
    console.error('Discord status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
