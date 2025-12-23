'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    community_id: '',
    company_id: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    private: false,
  })

  useEffect(() => {
    // Get current user from Supabase Auth
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Get communities user is a member of
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id, role')
        .eq('profile_id', user.id)

      if (memberships && memberships.length > 0) {
        const communityIds = memberships.map(m => m.community_id)
        const { data } = await supabase
          .from('communities')
          .select('*')
          .in('id', communityIds)

        if (data) {
          setCommunities(data)
          if (data.length === 1) {
            setFormData(prev => ({ ...prev, community_id: data[0].id }))
          }
        }
      }
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login')
      } else if (session?.user) {
        setUserId(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !userId) {
        throw new Error('Not authenticated')
      }

      // Use Supabase user ID as organizer_id
      const { data, error } = await supabase
        .from('projects')
        .insert({
          organizer_id: userId,
          ...formData,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/projects/${data.id}`)
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <GlassCard>
          <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

          {communities.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <p>You need to be a member of a community to create a project.</p>
              <Link href="/communities" className="text-blue-600 hover:underline">
                Browse Communities
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Project Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                placeholder="Describe your project..."
              />
            </div>

            <div>
              <label htmlFor="community_id" className="block text-sm font-medium mb-2">
                Community *
              </label>
              <select
                id="community_id"
                value={formData.community_id}
                onChange={(e) => setFormData({ ...formData, community_id: e.target.value })}
                required
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                disabled={communities.length === 0}
              >
                <option value="">Select a community</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium mb-2">
                  Start Date
                </label>
                <input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium mb-2">
                  End Date
                </label>
                <input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="glass-input-enhanced w-full px-4 py-2 rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="private"
                type="checkbox"
                checked={formData.private}
                onChange={(e) => setFormData({ ...formData, private: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="private" className="text-sm font-medium">
                Make this project private
              </label>
            </div>

            <div className="flex gap-4">
              <GlassButton
                type="submit"
                variant="primary"
                disabled={loading || communities.length === 0}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </GlassButton>
              <GlassButton
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

