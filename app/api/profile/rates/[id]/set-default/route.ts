import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Update profile default_rate_id
    const { error } = await supabase
      .from('profiles')
      .update({ default_rate_id: params.id })
      .eq('id', user.id);

    if (error) {
      console.error('Error setting default rate:', error);
      return NextResponse.json({ error: 'Failed to set default rate' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set default rate API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
