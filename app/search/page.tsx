'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import Link from 'next/link'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState<'all' | 'profiles' | 'projects' | 'companies' | 'communities'>(
    (searchParams.get('type') as any) || 'all'
  )
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (type !== 'all') params.set('type', type)

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Search</h1>

        {/* Search Form */}
        <GlassCard className="mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search profiles, projects, companies, communities..."
                className="glass-input-enhanced w-full px-4 py-3 rounded-lg text-lg"
              />
            </div>

            <div className="flex gap-4 items-center">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="glass-input-enhanced px-4 py-2 rounded-lg"
              >
                <option value="all">All</option>
                <option value="profiles">Profiles</option>
                <option value="projects">Projects</option>
                <option value="companies">Companies</option>
                <option value="communities">Communities</option>
              </select>

              <GlassButton type="submit" variant="primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Profiles */}
            {(!type || type === 'all' || type === 'profiles') && results.profiles && results.profiles.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Profiles ({results.profiles.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.profiles.map((profile: any) => (
                    <Link key={profile.id} href={`/profiles/${profile.id}`}>
                      <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                        <h3 className="text-xl font-bold mb-2">{profile.name}</h3>
                        {profile.bio && (
                          <p className="text-gray-600 line-clamp-2">{profile.bio}</p>
                        )}
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {(!type || type === 'all' || type === 'projects') && results.projects && results.projects.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Projects ({results.projects.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.projects.map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                        <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                        {project.description && (
                          <p className="text-gray-600 line-clamp-2">{project.description}</p>
                        )}
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Companies */}
            {(!type || type === 'all' || type === 'companies') && results.companies && results.companies.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Companies ({results.companies.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.companies.map((company: any) => (
                    <GlassCard key={company.id} className="hover:scale-105 transition-transform cursor-pointer">
                      <h3 className="text-xl font-bold mb-2">{company.name}</h3>
                      {company.description && (
                        <p className="text-gray-600 line-clamp-2">{company.description}</p>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {/* Communities */}
            {(!type || type === 'all' || type === 'communities') && results.communities && results.communities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Communities ({results.communities.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.communities.map((community: any) => (
                    <Link key={community.id} href={`/communities/${community.id}`}>
                      <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                        <h3 className="text-xl font-bold mb-2">{community.name}</h3>
                        {community.description && (
                          <p className="text-gray-600 line-clamp-2">{community.description}</p>
                        )}
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {(!results.profiles || results.profiles.length === 0) &&
             (!results.projects || results.projects.length === 0) &&
             (!results.companies || results.companies.length === 0) &&
             (!results.communities || results.communities.length === 0) && (
              <GlassCard>
                <p className="text-center text-gray-500 py-8">
                  No results found. Try a different search term.
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 pt-24">
        <GlassCard>
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </GlassCard>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}


