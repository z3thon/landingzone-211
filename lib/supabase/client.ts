import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  // In @supabase/ssr v0.8.0+, createBrowserClient automatically handles cookies using document.cookie
  // However, we still need to provide explicit cookie handlers to ensure PKCE verifier is stored in cookies
  // (not localStorage) so the server can access it during the callback
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          const cookies = document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=')
            const value = rest.join('=')
            return { name: name.trim(), value: decodeURIComponent(value) }
          })
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            // Browser cookies cannot be httpOnly - that's server-only
            // Ensure cookies persist through redirects with proper attributes
            let cookieString = `${name}=${encodeURIComponent(value)}`
            cookieString += `; path=${options?.path || '/'}`
            cookieString += `; samesite=${options?.sameSite || 'lax'}`
            if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
            if (options?.domain) cookieString += `; domain=${options.domain}`
            if (options?.secure) cookieString += '; secure'
            document.cookie = cookieString
          })
        },
      },
    }
  )
}

