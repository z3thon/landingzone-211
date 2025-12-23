import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    const rateTypeId = searchParams.get('rate_type_id')

    let query = supabase
      .from('rates')
      .select(`
        *,
        rate_type:rate_types(*),
        profile:profiles!rates_profile_id_fkey(id, name, avatar_url)
      `)

    if (profileId) {
      query = query.eq('profile_id', profileId)
    }

    if (rateTypeId) {
      query = query.eq('rate_type_id', rateTypeId)
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

    // Users can only add rates to their own profile
    if (body.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // If this is a default or coaching rate, unset others
    if (body.is_default) {
      const updateQuery = supabase
        .from('rates')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ is_default: false })
        .eq('profile_id', user.id)
        .eq('is_default', true)
      await updateQuery
    }

    if (body.is_coaching) {
      const updateQuery = supabase
        .from('rates')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ is_coaching: false })
        .eq('profile_id', user.id)
        .eq('is_coaching', true)
      await updateQuery
    }

    const { data, error } = await supabase
      .from('rates')
      .insert({
        profile_id: user.id,
        ...body,
      })
      .select(`
        *,
        rate_type:rate_types(*)
      `)
      .single()

    if (error) throw error

    const typedData = data as { id: string; is_default?: boolean; is_coaching?: boolean; [key: string]: any }

    // Update profile references if needed
    if (typedData.is_default) {
      const updateQuery = supabase
        .from('profiles')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ default_rate_id: typedData.id })
        .eq('id', user.id)
      await updateQuery
    }

    if (typedData.is_coaching) {
      const updateQuery = supabase
        .from('profiles')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update({ coaching_rate_id: typedData.id })
        .eq('id', user.id)
      await updateQuery
    }

    return NextResponse.json(typedData, { status: 201 })
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
    const rateId = searchParams.get('id')

    if (!rateId) {
      return NextResponse.json(
        { error: 'Rate ID required' },
        { status: 400 }
      )
    }

    // Check ownership
    const { data: rateData } = await supabase
      .from('rates')
      .select('profile_id')
      .eq('id', rateId)
      .single()

    const rate = rateData as { profile_id: string } | null

    if (!rate || rate.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('rates')
      .delete()
      .eq('id', rateId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


