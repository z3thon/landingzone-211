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
      .from('token_balances')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching token balance:', error);
      return NextResponse.json({ error: 'Failed to fetch token balance' }, { status: 500 });
    }

    return NextResponse.json(data || { balance_usd: 0, currency: 'USD' });
  } catch (error) {
    console.error('Token balance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
