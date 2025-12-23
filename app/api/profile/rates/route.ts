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
    
    // Get user's profile to check default/coaching rates
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_rate_id, coaching_rate_id')
      .eq('id', user.id)
      .single();

    // Get all rates with types
    const { data: rates, error } = await supabase
      .from('rates')
      .select(`
        *,
        rate_type:rate_types(id, name, description)
      `)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rates:', error);
      return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
    }

    // Mark default and coaching rates
    const ratesWithFlags = rates?.map((rate: any) => ({
      ...rate,
      is_default_rate: profile?.default_rate_id === rate.id,
      is_coaching_rate: profile?.coaching_rate_id === rate.id,
    })) || [];

    return NextResponse.json(ratesWithFlags);
  } catch (error) {
    console.error('Rates API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      rate_type_id,
      rate_per_hour,
      currency,
      start_date,
      end_date,
      memo,
      is_default,
      is_coaching,
    } = body;

    if (!rate_type_id || rate_per_hour === undefined || !start_date) {
      return NextResponse.json(
        { error: 'Rate type, rate per hour, and start date are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current default/coaching rates if setting new ones
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_rate_id, coaching_rate_id')
      .eq('id', user.id)
      .single();

    // Create new rate
    const { data: newRate, error } = await supabase
      .from('rates')
      .insert({
        profile_id: user.id,
        rate_type_id,
        rate_per_hour: parseFloat(rate_per_hour),
        currency: currency || 'USD',
        start_date,
        end_date: end_date || null,
        memo: memo || null,
        status: 'active',
      })
      .select(`
        *,
        rate_type:rate_types(id, name, description)
      `)
      .single();

    if (error) {
      console.error('Error creating rate:', error);
      return NextResponse.json({ error: 'Failed to create rate' }, { status: 500 });
    }

    // Update profile references if needed
    const updates: any = {};
    if (is_default && profile?.default_rate_id !== newRate.id) {
      updates.default_rate_id = newRate.id;
    }
    if (is_coaching && profile?.coaching_rate_id !== newRate.id) {
      updates.coaching_rate_id = newRate.id;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }

    return NextResponse.json({ ...newRate, is_default_rate: is_default, is_coaching_rate: is_coaching });
  } catch (error) {
    console.error('Create rate API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
