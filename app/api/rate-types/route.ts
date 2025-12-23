import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const supabase = createServiceRoleClient();
    
    let query = supabase
      .from('rate_types')
      .select('*')
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching rate types:', error);
      return NextResponse.json({ error: 'Failed to fetch rate types' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Rate types API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
