import { getCurrentUser } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import Navigation from '@/components/Navigation'

export default async function Home() {
  // Get current user from Supabase Auth
  let user = null
  try {
    user = await getCurrentUser()
  } catch (error: any) {
    console.error('Error getting current user:', error)
    // Don't throw - continue rendering page
  }
  
  // Redirect authenticated users to dashboard
  // Note: redirect() throws a special Next.js error that should not be caught
  // Only redirect if we successfully got a user
  if (user && user.id) {
    redirect('/dashboard')
  }
  
  // Feature flag: Set to true to enable projects/explore features
  const ENABLE_PROJECTS_FEATURE = false;

  // Use service role client for Supabase queries (bypasses RLS)
  let featuredProjects: any[] = []
  
  if (ENABLE_PROJECTS_FEATURE) {
    try {
      const supabase = createServiceRoleClient()

      // Get featured projects (using service role client to bypass RLS)
      const { data } = await supabase
        .from('projects')
        .select(`
          *,
          organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url),
          community:communities(id, name, logo_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)
      
      featuredProjects = data || []
    } catch (error) {
      console.error('Error loading featured projects:', error)
      // Continue rendering page even if projects fail to load
    }
  }

  const navLinks = [
    ...(ENABLE_PROJECTS_FEATURE ? [{ href: '/projects', label: 'Projects' }] : []),
    { href: '/search', label: 'Search' },
  ]

  if (user) {
    navLinks.push({ href: `/profiles/${user.id}`, label: 'Profile' })
  }

  return (
    <>
      <Navigation
        logo="/logo.svg"
        logoAlt="Landing Zone"
        links={navLinks}
        cta={user ? undefined : { href: '/auth/login', label: 'Sign In' }}
      />
      
      <main className="min-h-screen p-8 pt-32">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4">Landing Zone</h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect Discord communities with professional marketplace functionality
            </p>
            {!user && (
              <div className="flex justify-center">
                <Link href="/auth/login">
                  <GlassButton variant="primary" className="text-lg px-8 py-4">
                    Get Started with Discord
                  </GlassButton>
                </Link>
              </div>
            )}
          </div>

          {/* Featured Projects - Hidden for MVP */}
          {ENABLE_PROJECTS_FEATURE && featuredProjects && featuredProjects.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Featured Projects</h2>
                <Link href="/projects">
                  <GlassButton variant="outline">View All</GlassButton>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <GlassCard className="h-full hover:scale-105 transition-transform cursor-pointer">
                      <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                      {project.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {project.organizer?.avatar_url && (
                          <img
                            src={project.organizer.avatar_url}
                            alt={project.organizer.name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span>{project.organizer?.name}</span>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <h3 className="text-xl font-bold mb-2">Multi-Community</h3>
              <p className="text-gray-600">
                Join multiple Discord communities and control your skill visibility per-community
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-xl font-bold mb-2">Voice Call Coaching</h3>
              <p className="text-gray-600">
                Per-minute billing for voice calls with secure escrow and automatic payouts
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-xl font-bold mb-2">Call Tracking & Payments</h3>
              <p className="text-gray-600">
                Track all your coaching sessions and get paid automatically after escrow period
              </p>
            </GlassCard>
          </div>
        </div>
      </main>
    </>
  )
}
