import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const communityIds = searchParams.get('community_ids');

    let query = supabase
      .from('projects')
      .select(`
        *,
        organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url),
        community:communities(id, name, logo_url)
      `)
      .eq('status', 'active')
      .eq('private', false);

    // Filter by community IDs if provided
    if (communityIds) {
      const ids = communityIds.split(',').filter(id => id.trim());
      if (ids.length > 0) {
        query = query.in('community_id', ids);
      }
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching public projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Public projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
