import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    const skillTypeId = searchParams.get('skill_type_id')

    let query = supabase
      .from('skills')
      .select(`
        *,
        skill_type:skill_types(*),
        profile:profiles!skills_profile_id_fkey(id, name, avatar_url)
      `)

    if (profileId) {
      query = query.eq('profile_id', profileId)
    }

    if (skillTypeId) {
      query = query.eq('skill_type_id', skillTypeId)
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

    // Users can only add skills to their own profile
    if (body.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('skills')
      .insert({
        profile_id: user.id,
        ...body,
      })
      .select(`
        *,
        skill_type:skill_types(*)
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

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('id')

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID required' },
        { status: 400 }
      )
    }

    // Check ownership
    const { data: skillData } = await supabase
      .from('skills')
      .select('profile_id')
      .eq('id', skillId)
      .single()

    const skill = skillData as { profile_id: string } | null

    if (!skill || skill.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


