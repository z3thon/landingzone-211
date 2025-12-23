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
    const { industry_type_id, from_date, to_date } = body;

    const supabase = createServiceRoleClient();

    // Verify industry belongs to user
    const { data: industry } = await supabase
      .from('industries')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!industry) {
      return NextResponse.json({ error: 'Industry not found' }, { status: 404 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (industry_type_id) updateData.industry_type_id = industry_type_id;
    if (from_date) updateData.from_date = from_date;
    if (to_date !== undefined) updateData.to_date = to_date;

    const updateQuery = supabase
      .from('industries')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        industry_type:industries_types(id, name, abbreviation)
      `)
      .single();
    const { data, error } = await updateQuery;

    if (error) {
      console.error('Error updating industry:', error);
      return NextResponse.json({ error: 'Failed to update industry' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update industry API error:', error);
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

    // Verify industry belongs to user
    const { data: industry } = await supabase
      .from('industries')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!industry) {
      return NextResponse.json({ error: 'Industry not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('industries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting industry:', error);
      return NextResponse.json({ error: 'Failed to delete industry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete industry API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
