import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('id')
    const memberId = searchParams.get('member_id')

    if (communityId) {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          members:community_members(
            id,
            role,
            joined_at,
            profile:profiles(id, name, avatar_url)
          )
        `)
        .eq('id', communityId)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    let query = supabase
      .from('communities')
      .select('*', { count: 'exact' })

    if (memberId) {
      // Get communities for a specific member
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('profile_id', memberId)

      if (memberships && memberships.length > 0) {
        const communityIds = memberships.map(m => m.community_id)
        query = query.in('id', communityIds)
      } else {
        return NextResponse.json({ data: [], count: 0 })
      }
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    const body = await request.json()

    // Create community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert(body)
      .select()
      .single()

    if (communityError) throw communityError

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        profile_id: user.id,
        community_id: community.id,
        role: 'owner',
      })

    if (memberError) {
      // Rollback community creation
      await supabase.from('communities').delete().eq('id', community.id)
      throw memberError
    }

    return NextResponse.json(community, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('id')

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID required' },
        { status: 400 }
      )
    }

    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('communities')
      .update(body)
      .eq('id', communityId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


