import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'all', 'public', 'private'
    const projectId = searchParams.get('project_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createServiceRoleClient();
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_profile_id_fkey(id, name, avatar_url),
        project_approval:project_approvals(
          id,
          project:projects(id, name)
        )
      `)
      .eq('reviewee_profile_id', user.id);

    if (filter === 'public') {
      query = query.eq('is_private', false);
    } else if (filter === 'private') {
      query = query.eq('is_private', true);
    }

    if (projectId) {
      query = query.eq('project_approval_id', projectId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get statistics
    const totalCount = data?.length || 0;
    const publicCount = data?.filter((r: any) => !r.is_private).length || 0;
    const privateCount = data?.filter((r: any) => r.is_private).length || 0;
    const anonymousCount = data?.filter((r: any) => r.is_anonymous).length || 0;

    // Get unique projects
    const projects = Array.from(
      new Set(
        data
          ?.filter((r: any) => r.project_approval?.project)
          .map((r: any) => ({
            id: r.project_approval.project.id,
            name: r.project_approval.project.name,
          })) || []
      )
    );

    return NextResponse.json({
      reviews: data || [],
      statistics: {
        total: totalCount,
        public: publicCount,
        private: privateCount,
        anonymous: anonymousCount,
      },
      projects,
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
