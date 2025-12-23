import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
    const { error } = await supabase
      .from('discord_users')
      .delete()
      .eq('profile_id', user.id);

    if (error) {
      console.error('Error disconnecting Discord:', error);
      return NextResponse.json({ error: 'Failed to disconnect Discord' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discord disconnect API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
