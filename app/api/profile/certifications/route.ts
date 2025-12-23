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
      .from('certifications')
      .select(`
        *,
        certification_type:certification_types(id, name, description)
      `)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching certifications:', error);
      return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
    }

    // Auto-update expired certifications
    const now = new Date().toISOString().split('T')[0];
    const expired = data?.filter((c: any) => c.end_date && c.end_date < now && c.status === 'active') || [];
    
    if (expired.length > 0) {
      const expiredIds = expired.map((c: any) => c.id);
      const updateQuery = supabase
        .from('certifications')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ status: 'expired' })
        .in('id', expiredIds);
      await updateQuery;
      
      // Update local data
      data?.forEach((c: any) => {
        if (expiredIds.includes(c.id)) {
          c.status = 'expired';
        }
      });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Certifications API error:', error);
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
    const { certification_type_id, title, attachment_type, file_url, url, effective_date, end_date, status } = body;

    if (!certification_type_id || !title) {
      return NextResponse.json({ error: 'Certification type and title are required' }, { status: 400 });
    }

    if (attachment_type === 'file' && !file_url) {
      return NextResponse.json({ error: 'File URL is required for file attachments' }, { status: 400 });
    }

    if (attachment_type === 'url' && !url) {
      return NextResponse.json({ error: 'URL is required for URL attachments' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const insertQuery = supabase
      .from('certifications')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .insert({
        profile_id: user.id,
        certification_type_id,
        title,
        attachment_type: attachment_type || null,
        file_url: attachment_type === 'file' ? file_url : null,
        url: attachment_type === 'url' ? url : null,
        effective_date: effective_date || null,
        end_date: end_date || null,
        status: status || 'active',
      })
      .select(`
        *,
        certification_type:certification_types(id, name, description)
      `)
      .single();
    const { data, error } = await insertQuery;

    if (error) {
      console.error('Error creating certification:', error);
      return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create certification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
