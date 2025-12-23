import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const revieweeId = searchParams.get('reviewee_id')
    const reviewerId = searchParams.get('reviewer_id')
    const projectApprovalId = searchParams.get('project_approval_id')

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_profile_id_fkey(id, name, avatar_url),
        reviewer:profiles!reviews_reviewer_profile_id_fkey(id, name, avatar_url),
        project_approval:project_approvals(
          id,
          project:projects(id, name)
        )
      `)

    if (revieweeId) {
      query = query.eq('reviewee_profile_id', revieweeId)
    }

    if (reviewerId) {
      query = query.eq('reviewer_profile_id', reviewerId)
    }

    if (projectApprovalId) {
      query = query.eq('project_approval_id', projectApprovalId)
    }

    // Filter out private reviews unless user is the reviewer or reviewee
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      query = query.eq('is_private', false)
    } else {
      // Show private reviews only to reviewer or reviewee
      query = query.or(
        `is_private.eq.false,reviewer_profile_id.eq.${user.id},reviewee_profile_id.eq.${user.id}`
      )
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewee_profile_id, review_text, project_approval_id, is_private, is_anonymous } = body;

    if (!reviewee_profile_id || !review_text) {
      return NextResponse.json(
        { error: 'Reviewee and review text are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const insertQuery = supabase
      .from('reviews')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .insert({
        reviewer_profile_id: user.id,
        reviewee_profile_id,
        review_text,
        project_approval_id: project_approval_id || null,
        is_private: is_private || false,
        is_anonymous: is_anonymous || false,
      })
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_profile_id_fkey(id, name, avatar_url),
        reviewer:profiles!reviews_reviewer_profile_id_fkey(id, name, avatar_url)
      `)
      .single();
    const { data, error } = await insertQuery;

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Create review API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}


