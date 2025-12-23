import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    const certificationId = searchParams.get('id')

    if (certificationId) {
      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          certification_type:certification_types(*),
          profile:profiles!certifications_profile_id_fkey(id, name, avatar_url)
        `)
        .eq('id', certificationId)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    let query = supabase
      .from('certifications')
      .select(`
        *,
        certification_type:certification_types(*),
        profile:profiles!certifications_profile_id_fkey(id, name, avatar_url)
      `)

    if (profileId) {
      query = query.eq('profile_id', profileId)
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

    // Users can only add certifications to their own profile
    if (body.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('certifications')
      .insert({
        profile_id: user.id,
        ...body,
      })
      .select(`
        *,
        certification_type:certification_types(*)
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
    const certificationId = searchParams.get('id')

    if (!certificationId) {
      return NextResponse.json(
        { error: 'Certification ID required' },
        { status: 400 }
      )
    }

    // Check ownership
    const { data: certification, error: certError } = await supabase
      .from('certifications')
      .select('profile_id')
      .eq('id', certificationId)
      .single()

    if (certError || !certification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    if ((certification as { profile_id: string }).profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certificationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


