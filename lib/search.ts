import { createClient } from '@/lib/supabase/server'

export interface SearchFilters {
  query?: string
  skills?: string[]
  industries?: string[]
  rateMin?: number
  rateMax?: number
  communityId?: string
  available?: boolean
  type?: 'profiles' | 'projects' | 'companies' | 'communities'
}

export async function searchProfiles(filters: SearchFilters) {
  const supabase = await createClient()
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  if (filters.query) {
    // Use pg_trgm for fuzzy search
    query = query.or(`name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`)
  }

  if (filters.available !== undefined) {
    query = query.eq('available', filters.available)
  }

  const { data, error, count } = await query.limit(50)

  if (error) {
    throw error
  }

  return { data, count }
}

export async function searchProjects(filters: SearchFilters) {
  const supabase = await createClient()
  let query = supabase
    .from('projects')
    .select(`
      *,
      organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url),
      community:communities(id, name, logo_url)
    `, { count: 'exact' })

  if (filters.query) {
    query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
  }

  if (filters.communityId) {
    query = query.eq('community_id', filters.communityId)
  }

  if (filters.skills && filters.skills.length > 0) {
    // Filter by needed skills
    const { data: projectSkills } = await supabase
      .from('project_needed_skills')
      .select('project_id')
      .in('skill_type_id', filters.skills)

    if (projectSkills && projectSkills.length > 0) {
      const typedProjectSkills = projectSkills as { project_id: string; [key: string]: any }[]
      const projectIds = typedProjectSkills.map(ps => ps.project_id)
      query = query.in('id', projectIds)
    } else {
      // No projects match - return empty
      return { data: [], count: 0 }
    }
  }

  const { data, error, count } = await query.limit(50)

  if (error) {
    throw error
  }

  return { data, count }
}

export async function searchCompanies(filters: SearchFilters) {
  const supabase = await createClient()
  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })

  if (filters.query) {
    query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
  }

  const { data, error, count } = await query.limit(50)

  if (error) {
    throw error
  }

  return { data, count }
}

export async function searchCommunities(filters: SearchFilters) {
  const supabase = await createClient()
  let query = supabase
    .from('communities')
    .select('*', { count: 'exact' })

  if (filters.query) {
    query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
  }

  const { data, error, count } = await query.limit(50)

  if (error) {
    throw error
  }

  return { data, count }
}

export async function performSearch(filters: SearchFilters) {
  const results: any = {
    profiles: [],
    projects: [],
    companies: [],
    communities: [],
  }

  if (!filters.type || filters.type === 'profiles') {
    const profileResults = await searchProfiles(filters)
    results.profiles = profileResults.data || []
  }

  if (!filters.type || filters.type === 'projects') {
    const projectResults = await searchProjects(filters)
    results.projects = projectResults.data || []
  }

  if (!filters.type || filters.type === 'companies') {
    const companyResults = await searchCompanies(filters)
    results.companies = companyResults.data || []
  }

  if (!filters.type || filters.type === 'communities') {
    const communityResults = await searchCommunities(filters)
    results.communities = communityResults.data || []
  }

  return results
}


