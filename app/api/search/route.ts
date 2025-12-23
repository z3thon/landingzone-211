import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { performSearch } from '@/lib/search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') as 'profiles' | 'projects' | 'companies' | 'communities' | null

    const filters = {
      query: query || undefined,
      type: type || undefined,
    }

    const results = await performSearch(filters)

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


