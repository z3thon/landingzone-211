import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description } = body;

    const supabase = createServiceRoleClient();

    // Verify skill belongs to user
    const { data: skill } = await supabase
      .from('skills')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', user.id)
      .single();

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Update skill
    const { data, error } = await supabase
      .from('skills')
      .update({
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        skill_type:skill_types(id, name, description, is_language, language_abbreviation, native_name)
      `)
      .single();

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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Verify skill belongs to user
    const { data: skill } = await supabase
      .from('skills')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', user.id)
      .single();

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Delete skill (cascade will handle visibility and endorsements)
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', params.id);

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
