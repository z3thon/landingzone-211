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
      .from('industries')
      .select(`
        *,
        industry_type:industries_types(id, name, abbreviation)
      `)
      .eq('profile_id', user.id)
      .order('from_date', { ascending: false });

    if (error) {
      console.error('Error fetching industries:', error);
      return NextResponse.json({ error: 'Failed to fetch industries' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Industries API error:', error);
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
    const { industry_type_id, from_date, to_date } = body;

    if (!industry_type_id || !from_date) {
      return NextResponse.json(
        { error: 'Industry type and from date are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('industries')
      .insert({
        profile_id: user.id,
        industry_type_id,
        from_date,
        to_date: to_date || null,
      } as any)
      .select(`
        *,
        industry_type:industries_types(id, name, abbreviation)
      `)
      .single();

    if (error) {
      console.error('Error creating industry:', error);
      return NextResponse.json({ error: 'Failed to create industry' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create industry API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
