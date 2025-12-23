import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createServiceRoleClient();

  const { data: projectData } = await supabase
    .from('projects')
    .select(`
      *,
      community:communities(id, name, logo_url),
      company:companies(id, name)
    `)
    .eq('id', id)
    .eq('organizer_id', user.id)
    .single();

  const project = projectData as { id: string; name: string; description: string; [key: string]: any } | null;

  if (!project) {
    notFound();
  }

  const { data: applications } = await supabase
    .from('project_approvals')
    .select(`
      *,
      profile:profiles(id, name, avatar_url, email)
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const { data: outlines } = await supabase
    .from('project_outlines')
    .select('*')
    .eq('project_id', id)
    .order('order_number', { ascending: true });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/projects" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Projects
          </Link>
          <h1 className="text-4xl font-bold">{project.name}</h1>
          <p className="text-gray-600 mt-2">{project.description}</p>
        </div>
        <GlassButton variant="primary">Edit Project</GlassButton>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-2">Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            project.status === 'active' ? 'bg-green-100 text-green-800' :
            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {project.status}
          </span>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold mb-2">Community</h3>
          <p className="text-gray-600">{project.community?.name || 'N/A'}</p>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold mb-2">Dates</h3>
          <p className="text-gray-600">
            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'} - 
            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
          </p>
        </GlassCard>
      </div>

      {/* Applications */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Applications ({applications?.length || 0})</h2>
        </div>
        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <div key={app.id} className="p-4 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {app.profile?.avatar_url && (
                      <img
                        src={app.profile.avatar_url}
                        alt={app.profile.name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{app.profile?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">{app.profile?.email}</p>
                      {app.notes && (
                        <p className="text-gray-600 mt-2">{app.notes}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      app.approved ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.approved ? 'Approved' : 'Pending'}
                    </span>
                    {!app.approved && (
                      <GlassButton variant="primary" className="text-sm py-2 px-4">
                        Approve
                      </GlassButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No applications yet.</p>
        )}
      </GlassCard>

      {/* Project Outlines */}
      {outlines && outlines.length > 0 && (
        <GlassCard>
          <h2 className="text-2xl font-bold mb-4">Project Outlines</h2>
          <div className="space-y-4">
            {outlines.map((outline: any) => (
              <div key={outline.id} className="p-4 rounded-lg bg-white/10">
                <h3 className="font-semibold mb-2">{outline.title}</h3>
                <p className="text-gray-600">{outline.outline}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
