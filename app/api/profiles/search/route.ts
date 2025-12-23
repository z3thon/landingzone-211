import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!search || search.length < 2) {
      return NextResponse.json([]);
    }

    const supabase = createServiceRoleClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .ilike('name', `%${search}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching profiles:', error);
      return NextResponse.json({ error: 'Failed to search profiles' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Profile search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
