import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { certification_type_id, title, attachment_type, file_url, url, effective_date, end_date, status } = body;

    const supabase = createServiceRoleClient();

    // Verify certification belongs to user
    const { data: cert } = await supabase
      .from('certifications')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (certification_type_id) updateData.certification_type_id = certification_type_id;
    if (title) updateData.title = title;
    if (attachment_type !== undefined) {
      updateData.attachment_type = attachment_type;
      if (attachment_type === 'file') {
        updateData.file_url = file_url;
        updateData.url = null;
      } else if (attachment_type === 'url') {
        updateData.url = url;
        updateData.file_url = null;
      } else {
        updateData.file_url = null;
        updateData.url = null;
      }
    }
    if (effective_date !== undefined) updateData.effective_date = effective_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status) updateData.status = status;

    const updateQuery = supabase
      .from('certifications')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        certification_type:certification_types(id, name, description)
      `)
      .single();
    const { data, error } = await updateQuery;

    if (error) {
      console.error('Error updating certification:', error);
      return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update certification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Verify certification belongs to user
    const { data: cert } = await supabase
      .from('certifications')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting certification:', error);
      return NextResponse.json({ error: 'Failed to delete certification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete certification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
