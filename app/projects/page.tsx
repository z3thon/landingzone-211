import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createServiceRoleClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      community:communities(id, name, logo_url),
      applications:project_approvals(count)
    `)
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Projects</h1>
          <p className="text-gray-600">Manage your projects and track applications</p>
        </div>
        <Link href="/projects/new">
          <GlassButton variant="primary">Create New Project</GlassButton>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <GlassCard className="h-full hover:scale-105 transition-transform cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold flex-1">{project.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {project.applications?.[0]?.count || 0} application{project.applications?.[0]?.count !== 1 ? 's' : ''}
                  </span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't created any projects yet.</p>
            <Link href="/projects/new">
              <GlassButton variant="primary">Create Your First Project</GlassButton>
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

