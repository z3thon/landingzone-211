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
    const { review_text, is_private, is_anonymous } = body;

    if (!review_text) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Verify review belongs to user
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', params.id)
      .eq('reviewer_profile_id', user.id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({
        review_text,
        is_private: is_private || false,
        is_anonymous: is_anonymous || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_profile_id_fkey(id, name, avatar_url),
        reviewer:profiles!reviews_reviewer_profile_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update review API error:', error);
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

    // Verify review belongs to user
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', params.id)
      .eq('reviewer_profile_id', user.id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
