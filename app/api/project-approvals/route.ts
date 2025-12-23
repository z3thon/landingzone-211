import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const profileId = searchParams.get('profile_id');

    const supabase = createServiceRoleClient();

    let query = supabase
      .from('project_approvals')
      .select(`
        *,
        profile:profiles!project_approvals_profile_id_fkey(id, name, avatar_url),
        project:projects(id, name, description, status, community:communities(name)),
        role_type:role_types(*),
        rate:rates(*)
      `);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // If no profileId specified, default to current user
    const targetProfileId = profileId || user.id;
    query = query.eq('profile_id', targetProfileId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project approvals:', error);
      return NextResponse.json({ error: 'Failed to fetch project approvals' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Project approvals API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Check if approval already exists
    const { data: existing } = await supabase
      .from('project_approvals')
      .select('id')
      .eq('project_id', body.project_id)
      .eq('profile_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Application already exists' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('project_approvals')
      .insert({
        profile_id: user.id,
        ...body,
        invitation_type: body.invitation_type || 'application',
      })
      .select(`
        *,
        profile:profiles!project_approvals_profile_id_fkey(id, name, avatar_url),
        project:projects(*),
        role_type:role_types(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const approvalId = searchParams.get('id')

    if (!approvalId) {
      return NextResponse.json(
        { error: 'Approval ID required' },
        { status: 400 }
      )
    }

    // Get approval to check project ownership
    const { data: approvalData } = await supabase
      .from('project_approvals')
      .select('project_id, projects!inner(organizer_id)')
      .eq('id', approvalId)
      .single()

    if (!approvalData) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      )
    }

    const approval = approvalData as { project_id: string; projects: { organizer_id: string } }

    // Only project organizer can approve
    const project = approval.projects
    if (project.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updateData: any = { ...body }
    if (body.approved) {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    }

    const updateQuery = supabase
      .from('project_approvals')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(updateData)
      .eq('id', approvalId)
      .select(`
        *,
        profile:profiles!project_approvals_profile_id_fkey(id, name, avatar_url),
        project:projects(*),
        role_type:role_types(*)
      `)
      .single()
    const { data, error } = await updateQuery

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


