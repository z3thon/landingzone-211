import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    const communityId = searchParams.get('community_id')

    if (projectId) {
      // Get single project with related data
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url),
          company:companies(*),
          community:communities(id, name, logo_url)
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error

      return NextResponse.json(data)
    }

    // Get projects with filters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

    let query = supabase
      .from('projects')
      .select(`
        *,
        organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url),
        company:companies(id, name, logo_url),
        community:communities(id, name, logo_url)
      `, { count: 'exact' })

    if (communityId) {
      query = query.eq('community_id', communityId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      data,
      count,
      page,
      limit,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
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

    const { data, error } = await supabase
      .from('projects')
      .insert({
        organizer_id: user.id,
        ...body,
      })
      .select()
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
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      )
    }

    // Check if user is the organizer
    const { data: projectData } = await supabase
      .from('projects')
      .select('organizer_id')
      .eq('id', projectId)
      .single()

    const project = projectData as { organizer_id: string } | null

    if (!project || project.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updateQuery = supabase
      .from('projects')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .update(body)
      .eq('id', projectId)
      .select()
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


