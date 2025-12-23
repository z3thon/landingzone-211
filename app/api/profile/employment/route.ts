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
      .from('employment')
      .select(`
        *,
        company:companies(id, name, email, website, phone, logo_url, description)
      `)
      .eq('profile_id', user.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching employment:', error);
      return NextResponse.json({ error: 'Failed to fetch employment' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Employment API error:', error);
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
    const { company_id, start_date, end_date, status, is_company_admin } = body;

    if (!company_id || !start_date) {
      return NextResponse.json(
        { error: 'Company and start date are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const insertQuery = supabase
      .from('employment')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .insert({
        profile_id: user.id,
        company_id,
        start_date,
        end_date: end_date || null,
        status: status || 'active',
        is_company_admin: is_company_admin || false,
      })
      .select(`
        *,
        company:companies(id, name, email, website, phone, logo_url, description)
      `)
      .single();
    const { data, error } = await insertQuery;

    if (error) {
      console.error('Error creating employment:', error);
      return NextResponse.json({ error: 'Failed to create employment' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create employment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
