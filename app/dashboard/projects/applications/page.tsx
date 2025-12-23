import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createServiceRoleClient();

  const { data: applications } = await supabase
    .from('project_approvals')
    .select(`
      *,
      project:projects(id, name, description, status, community:communities(name))
    `)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  const pendingApps = applications?.filter((app: any) => !app.approved) || [];
  const approvedApps = applications?.filter((app: any) => app.approved) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">My Applications</h1>
        <p className="text-gray-600">Track your project applications and job submissions</p>
      </div>

      {/* Pending Applications */}
      {pendingApps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Applications</h2>
          <div className="space-y-4">
            {pendingApps.map((app: any) => (
              <Link key={app.id} href={`/dashboard/projects/applications/${app.id}`}>
                <GlassCard className="hover:scale-[1.02] transition-transform cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{app.project?.name || 'Unknown Project'}</h3>
                      {app.project?.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{app.project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                        {app.project?.community && (
                          <span>Community: {app.project.community.name}</span>
                        )}
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-semibold ml-4">
                      Pending
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Approved Applications */}
      {approvedApps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Approved Applications</h2>
          <div className="space-y-4">
            {approvedApps.map((app: any) => (
              <Link key={app.id} href={`/dashboard/projects/applications/${app.id}`}>
                <GlassCard className="hover:scale-[1.02] transition-transform cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{app.project?.name || 'Unknown Project'}</h3>
                      {app.project?.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{app.project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Approved: {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : 'N/A'}</span>
                        {app.project?.community && (
                          <span>Community: {app.project.community.name}</span>
                        )}
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold ml-4">
                      Approved
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {applications?.length === 0 && (
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't applied to any projects yet.</p>
            <Link href="/dashboard/explore">
              <GlassButton variant="primary">Explore Projects</GlassButton>
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
