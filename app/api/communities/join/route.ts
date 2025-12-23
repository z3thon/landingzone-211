import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = authUser

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
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('discord_server_id')
      .eq('id', community_id)
      .single()

    if (communityError) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    if (community && (community as { discord_server_id: string | null }).discord_server_id) {
      // Check if user has Discord connected
      const { data: discordUser, error: discordError } = await supabase
        .from('discord_users')
        .select('discord_user_id, verified')
        .eq('profile_id', user.id)
        .single()

      if (discordError || !discordUser || !(discordUser as { verified: boolean }).verified) {
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
      // const discordServerId = (community as { discord_server_id: string }).discord_server_id
      // const isMember = await checkDiscordGuildMembership(discordToken, discordServerId)
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
      } as any)
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
