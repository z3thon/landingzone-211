import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createServiceRoleClient();

  const { data: application } = await supabase
    .from('project_approvals')
    .select(`
      *,
      project:projects(
        id,
        name,
        description,
        status,
        start_date,
        end_date,
        community:communities(id, name, logo_url),
        organizer:profiles!projects_organizer_id_fkey(id, name, avatar_url)
      )
    `)
    .eq('id', params.id)
    .eq('profile_id', user.id)
    .single();

  if (!application) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/projects/applications" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Applications
        </Link>
        <h1 className="text-4xl font-bold">Application Details</h1>
      </div>

      {/* Application Status */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Application Status</h2>
          <span className={`px-4 py-2 rounded-full font-semibold ${
            application.approved ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {application.approved ? 'Approved' : 'Pending'}
          </span>
        </div>
        {application.approved && application.approved_at && (
          <p className="text-gray-600">
            Approved on: {new Date(application.approved_at).toLocaleDateString()}
          </p>
        )}
        {application.notes && (
          <div className="mt-4 p-4 rounded-lg bg-white/10">
            <h3 className="font-semibold mb-2">Notes from Organizer</h3>
            <p className="text-gray-600">{application.notes}</p>
          </div>
        )}
      </GlassCard>

      {/* Project Details */}
      <GlassCard>
        <h2 className="text-2xl font-bold mb-4">Project Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">{application.project?.name}</h3>
            {application.project?.description && (
              <p className="text-gray-600 mb-4">{application.project.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-semibold">{application.project?.status || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Community</p>
              <p className="font-semibold">{application.project?.community?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <p className="font-semibold">
                {application.project?.start_date 
                  ? new Date(application.project.start_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">End Date</p>
              <p className="font-semibold">
                {application.project?.end_date 
                  ? new Date(application.project.end_date).toLocaleDateString()
                  : 'Ongoing'}
              </p>
            </div>
          </div>

          {application.project?.organizer && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-gray-600 mb-2">Project Organizer</p>
              <div className="flex items-center gap-3">
                {application.project.organizer.avatar_url && (
                  <img
                    src={application.project.organizer.avatar_url}
                    alt={application.project.organizer.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <p className="font-semibold">{application.project.organizer.name}</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Application Details */}
      <GlassCard>
        <h2 className="text-2xl font-bold mb-4">Your Application</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Applied On</p>
            <p className="font-semibold">{new Date(application.created_at).toLocaleDateString()}</p>
          </div>
          {application.skills && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(application.skills) && application.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
