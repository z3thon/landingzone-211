import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import Link from 'next/link'

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  // Get project with related data
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url, email),
      company:companies(*),
      community:communities(id, name, logo_url)
    `)
    .eq('id', params.id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Get project outlines
  const { data: outlines } = await supabase
    .from('project_outlines')
    .select('*')
    .eq('project_id', params.id)
    .order('order_number', { ascending: true })

  // Get project approvals
  const { data: approvals } = await supabase
    .from('project_approvals')
    .select(`
      *,
      profile:profiles!project_approvals_profile_id_fkey(id, name, avatar_url),
      role_type:role_types(*),
      rate:rates(*)
    `)
    .eq('project_id', params.id)

  // Get needed roles
  const { data: neededRoles } = await supabase
    .from('project_needed_roles')
    .select(`
      *,
      role_type:role_types(*)
    `)
    .eq('project_id', params.id)

  // Get needed skills
  const { data: neededSkills } = await supabase
    .from('project_needed_skills')
    .select(`
      *,
      skill_type:skill_types(*)
    `)
    .eq('project_id', params.id)

  // Get project files/URLs
  const { data: files } = await supabase
    .from('project_files_urls')
    .select('*')
    .eq('project_id', params.id)

  // Check if current user is organizer
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOrganizer = user?.id === project.organizer_id

  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Project Header */}
        <GlassCard>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {project.organizer && (
                  <div className="flex items-center gap-2">
                    {project.organizer.avatar_url && (
                      <img
                        src={project.organizer.avatar_url}
                        alt={project.organizer.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>Organizer: {project.organizer.name}</span>
                  </div>
                )}
                {project.community && (
                  <span>Community: {project.community.name}</span>
                )}
                {project.start_date && (
                  <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                )}
                {project.end_date && (
                  <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
              {isOrganizer && (
                <Link href={`/projects/${params.id}/edit`}>
                  <GlassButton variant="outline">Edit</GlassButton>
                </Link>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Project Outlines */}
        {outlines && outlines.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Project Outlines</h2>
            <div className="space-y-4">
              {outlines
                .filter((outline: any) => outline.published)
                .map((outline: any) => (
                  <div key={outline.id} className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-semibold mb-2">{outline.title}</h3>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: outline.outline }}
                    />
                  </div>
                ))}
            </div>
          </GlassCard>
        )}

        {/* Needed Roles & Skills */}
        {(neededRoles && neededRoles.length > 0) || (neededSkills && neededSkills.length > 0) && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Requirements</h2>
            
            {neededRoles && neededRoles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Roles Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {neededRoles.map((role: any) => (
                    <span
                      key={role.id}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {role.role_type?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {neededSkills && neededSkills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Skills Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {neededSkills.map((skill: any) => (
                    <span
                      key={skill.id}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {skill.skill_type?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Project Files/URLs */}
        {files && files.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Resources</h2>
            <div className="space-y-2">
              {files.map((file: any) => (
                <div key={file.id}>
                  {file.attachment_type === 'url' ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {file.url}
                    </a>
                  ) : (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Download File
                    </a>
                  )}
                  {file.memo && <p className="text-sm text-gray-500">{file.memo}</p>}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Project Approvals */}
        {approvals && approvals.length > 0 && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Team Members</h2>
            <div className="space-y-3">
              {approvals.map((approval: any) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-3"
                >
                  <div className="flex items-center gap-3">
                    {approval.profile?.avatar_url && (
                      <img
                        src={approval.profile.avatar_url}
                        alt={approval.profile.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{approval.profile?.name}</p>
                      {approval.role_type && (
                        <p className="text-sm text-gray-500">{approval.role_type.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    approval.approved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {approval.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Apply/Join Button */}
        {!isOrganizer && user && (
          <GlassCard>
            <div className="text-center">
              <p className="mb-4">Interested in joining this project?</p>
              <Link href={`/projects/${params.id}/apply`}>
                <GlassButton variant="primary">Apply to Join</GlassButton>
              </Link>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}


