import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createSession, setSessionCookie, deleteSession } from '@/lib/session'
import { createProfile } from '@/lib/auth'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const next = searchParams.get('next') ?? '/dashboard'

    // Check for OAuth errors from Discord
    if (errorParam) {
      console.error('Discord OAuth error:', errorParam, errorDescription)
      const errorCode = searchParams.get('error_code')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorParam)}&error_code=${encodeURIComponent(errorCode || '')}&description=${encodeURIComponent(errorDescription || '')}`)
    }

    if (!code) {
      console.error('No authorization code received in callback')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
    }

    // Verify state for CSRF protection
    const storedState = request.cookies.get('oauth_state')?.value
    if (!state || !storedState || state !== storedState) {
      console.error('Invalid OAuth state')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=invalid_state`)
    }

    const clientId = process.env.DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`

    if (!clientId || !clientSecret) {
      console.error('Discord OAuth not configured')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=config`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Discord token exchange error:', errorText)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=token_exchange`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Fetch user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to fetch Discord user info')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=user_fetch`)
    }

    const discordUser = await userResponse.json()
    const discordUserId = discordUser.id
    const discordUsername = discordUser.username || discordUser.global_name
    const discordEmail = discordUser.email
    const discordAvatar = discordUser.avatar

    // Create or get user profile in Supabase
    const supabase = createServiceRoleClient()
    
    // Check if Discord user already exists in discord_users table
    const { data: existingDiscordUserData } = await supabase
      .from('discord_users')
      .select('profile_id')
      .eq('discord_user_id', discordUserId)
      .single()

    const existingDiscordUser = existingDiscordUserData as { profile_id: string } | null

    let profileId: string

    if (existingDiscordUser?.profile_id) {
      // Use existing profile ID
      profileId = existingDiscordUser.profile_id
    } else {
      // Generate new UUID for profile
      profileId = randomUUID()
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    if (!existingProfile) {
      // Create profile with all data at once
      const avatarUrl = discordAvatar ? `https://cdn.discordapp.com/avatars/${discordUserId}/${discordAvatar}.png` : null
      
      const insertQuery = supabase
        .from('profiles')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .insert({
          id: profileId,
          name: discordUsername || discordEmail?.split('@')[0] || 'User',
          email: discordEmail,
          avatar_url: avatarUrl,
        })
      const { error: profileError } = await insertQuery

      if (profileError) {
        console.error('Error creating profile:', {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          profileId,
        })
        
        // If it's a unique constraint error, profile might already exist - try to fetch it
        if (profileError.code === '23505') {
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', profileId)
            .single()
          
          if (!retryProfile) {
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=db_error&message=${encodeURIComponent(`Failed to create profile: ${profileError.message}`)}`)
          }
        } else {
          return NextResponse.redirect(`${origin}/auth/auth-code-error?error=db_error&message=${encodeURIComponent(`Failed to create profile: ${profileError.message}`)}`)
        }
      }
    } else {
      // Update profile with latest Discord info
      const updateData: any = {}
      if (discordEmail) updateData.email = discordEmail
      if (discordUsername) updateData.name = discordUsername
      if (discordAvatar) {
        updateData.avatar_url = `https://cdn.discordapp.com/avatars/${discordUserId}/${discordAvatar}.png`
      }

      if (Object.keys(updateData).length > 0) {
        const updateQuery = supabase
          .from('profiles')
          // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
          .update(updateData)
          .eq('id', profileId)
        const { error: updateError } = await updateQuery
        
        if (updateError) {
          console.error('Error updating profile:', updateError)
          // Continue anyway - not critical
        }
      }
    }

    // Ensure profile exists before storing Discord user data
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    if (!finalProfile) {
      console.error('Profile does not exist after creation attempt:', profileId)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=db_error&message=${encodeURIComponent('Failed to create user profile')}`)
    }

    // Store Discord user data and tokens
    // First, check if a record exists with this discord_user_id
    const { data: existingDiscordRecord } = await supabase
      .from('discord_users')
      .select('profile_id')
      .eq('discord_user_id', discordUserId)
      .single()

    const discordUserData = {
      profile_id: profileId,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
      verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let discordError
    if (existingDiscordRecord) {
      // Update existing record
      const updateQuery = supabase
        .from('discord_users')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .update(discordUserData)
        .eq('discord_user_id', discordUserId)
      const { error } = await updateQuery
      discordError = error
    } else {
      // Insert new record
      const insertQuery = supabase
        .from('discord_users')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .insert(discordUserData)
      const { error } = await insertQuery
      discordError = error
    }

    if (discordError) {
      console.error('Error storing Discord user:', {
        error: discordError,
        code: discordError.code,
        message: discordError.message,
        details: discordError.details,
        hint: discordError.hint,
        profileId,
        discordUserId,
        existingRecord: !!existingDiscordRecord,
      })
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=db_error&message=${encodeURIComponent(discordError.message || 'Database error')}`)
    }

    // Create session
    const session = await createSession(profileId, discordEmail || undefined)
    
    // Create redirect response
    const redirectResponse = NextResponse.redirect(`${origin}${next}`, { status: 303 })
    
    // Set session cookie
    setSessionCookie(redirectResponse, session)
    
    // Clear OAuth state cookie
    redirectResponse.cookies.delete('oauth_state')

    return redirectResponse
  } catch (error: any) {
    console.error('Callback route error:', error)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exception&message=${encodeURIComponent(error?.message || 'Unknown error')}`)
  }
}
