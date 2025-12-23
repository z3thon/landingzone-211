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
    const { description } = body;

    const supabase = createServiceRoleClient();

    // Verify skill belongs to user
    const { data: skill } = await supabase
      .from('skills')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Update skill
    const updateQuery = supabase
      .from('skills')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update({
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        skill_type:skill_types(id, name, description, is_language, language_abbreviation, native_name)
      `)
      .single();
    const { data, error } = await updateQuery;

    if (error) {
      console.error('Error updating skill:', error);
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update skill API error:', error);
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

    // Verify skill belongs to user
    const { data: skill } = await supabase
      .from('skills')
      .select('id')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Delete skill (cascade will handle visibility and endorsements)
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting skill:', error);
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete skill API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
