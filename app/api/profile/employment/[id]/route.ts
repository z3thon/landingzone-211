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
    const { company_id, start_date, end_date, status, is_company_admin } = body;

    const supabase = createServiceRoleClient();

    // Verify employment belongs to user
    const { data: employment } = await supabase
      .from('employment')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!employment) {
      return NextResponse.json({ error: 'Employment not found' }, { status: 404 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (company_id) updateData.company_id = company_id;
    if (start_date) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status) updateData.status = status;
    if (is_company_admin !== undefined) updateData.is_company_admin = is_company_admin;

    const updateQuery = supabase
      .from('employment')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        company:companies(id, name, email, website, phone, logo_url, description)
      `)
      .single();
    const { data, error } = await updateQuery;

    if (error) {
      console.error('Error updating employment:', error);
      return NextResponse.json({ error: 'Failed to update employment' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update employment API error:', error);
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

    // Verify employment belongs to user
    const { data: employment } = await supabase
      .from('employment')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!employment) {
      return NextResponse.json({ error: 'Employment not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('employment')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employment:', error);
      return NextResponse.json({ error: 'Failed to delete employment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
