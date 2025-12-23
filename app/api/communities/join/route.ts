import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const { community_id } = await request.json()

    if (!community_id) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('community_members')
      .select('id')
      .eq('profile_id', user.id)
      .eq('community_id', community_id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this community' },
        { status: 400 }
      )
    }

    // Get community Discord server ID
    const { data: community } = await supabase
      .from('communities')
      .select('discord_server_id')
      .eq('id', community_id)
      .single()

    if (community?.discord_server_id) {
      // Check if user has Discord connected
      const { data: discordUser } = await supabase
        .from('discord_users')
        .select('discord_user_id, verified')
        .eq('profile_id', user.id)
        .single()

      if (!discordUser || !discordUser.verified) {
        return NextResponse.json(
          { error: 'Please connect your Discord account first. You must be a member of the Discord server to join this community.' },
          { status: 403 }
        )
      }

      // TODO: Verify user is actually a member of the Discord server
      // This requires Discord API call with OAuth token to check guild membership
      // For now, we'll allow joining if Discord is connected and verified
      // In production, add Discord API call here:
      // const discordToken = await getDiscordToken(user.id)
      // const isMember = await checkDiscordGuildMembership(discordToken, community.discord_server_id)
      // if (!isMember) {
      //   return NextResponse.json(
      //     { error: 'You must be a member of the Discord server to join this community.' },
      //     { status: 403 }
      //   )
      // }
    }

    // Add user as a member
    const { data, error } = await supabase
      .from('community_members')
      .insert({
        profile_id: user.id,
        community_id: community_id,
        role: 'member',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error joining community:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join community' },
      { status: 500 }
    )
  }
}
