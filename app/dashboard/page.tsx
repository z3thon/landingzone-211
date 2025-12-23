import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createServiceRoleClient();

  // Feature flag: Set to true to enable projects/explore features
  const ENABLE_PROJECTS_FEATURE = false;

  // Get dashboard statistics - Focus on call tracking & payments
  const [callSessionsResult, voiceChannelsResult, reviewsResult, tokenBalanceResult, payoutsResult, coachCallSessions] = await Promise.all([
    supabase
      .from('call_sessions')
      .select('id', { count: 'exact', head: true })
      .or(`coach_profile_id.eq.${user.id},attendee_profile_id.eq.${user.id}`)
      .eq('status', 'completed'),
    supabase
      .from('voice_channels')
      .select('id', { count: 'exact', head: true })
      .eq('coach_profile_id', user.id)
      .eq('active', true),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewee_profile_id', user.id),
    supabase
      .from('token_balances')
      .select('balance_usd')
      .eq('profile_id', user.id)
      .single(),
    supabase
      .from('payouts')
      .select('net_amount')
      .eq('coach_profile_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('call_sessions')
      .select('id')
      .eq('coach_profile_id', user.id),
  ]);

  // Get escrow holdings for coach's call sessions
  const callSessionIds = coachCallSessions.data?.map(cs => cs.id) || [];
  const escrowResult = callSessionIds.length > 0
    ? await supabase
        .from('escrow_holdings')
        .select('amount')
        .eq('status', 'held')
        .in('call_session_id', callSessionIds)
    : { data: [] };

  const totalPayouts = payoutsResult.data?.reduce((sum: number, p: any) => sum + (p.net_amount || 0), 0) || 0;
  const totalEscrow = escrowResult.data?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

  const stats = {
    completedCalls: callSessionsResult.count || 0,
    activeVoiceChannels: voiceChannelsResult.count || 0,
    reviews: reviewsResult.count || 0,
    tokenBalance: tokenBalanceResult.data?.balance_usd || 0,
    totalEarnings: totalPayouts,
    pendingEscrow: totalEscrow,
  };

  // Get recent call sessions
  const { data: recentCallSessions } = await supabase
    .from('call_sessions')
    .select(`
      id,
      started_at,
      duration_minutes,
      total_cost,
      status,
      coach_profile:profiles!call_sessions_coach_profile_id_fkey(id, name, avatar_url),
      attendee_profile:profiles!call_sessions_attendee_profile_id_fkey(id, name, avatar_url),
      voice_channel:voice_channels(id, channel_name)
    `)
    .or(`coach_profile_id.eq.${user.id},attendee_profile_id.eq.${user.id}`)
    .order('started_at', { ascending: false })
    .limit(5);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your account.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">My Projects</p>
              <p className="text-3xl font-bold">{stats.projects}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Applications</p>
              <p className="text-3xl font-bold">{stats.pendingApplications}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reviews Received</p>
              <p className="text-3xl font-bold">{stats.reviews}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Token Balance</p>
              <p className="text-3xl font-bold">${stats.tokenBalance.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions - Focus on Call Tracking & Payments */}
      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/settings?section=voice">
          <GlassButton variant="primary">Manage Voice Channels</GlassButton>
        </Link>
        <Link href="/dashboard/profile">
          <GlassButton variant="glass">Edit Profile</GlassButton>
        </Link>
        <Link href="/dashboard/settings?section=financial">
          <GlassButton variant="glass">View Payments</GlassButton>
        </Link>
        <Link href="/dashboard/communities">
          <GlassButton variant="glass">Communities</GlassButton>
        </Link>
      </div>

      {/* Recent Activity - Call Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Call Sessions</h2>
            <Link href="/dashboard/settings?section=voice">
              <GlassButton variant="outline" className="text-sm py-2 px-4">
                View All
              </GlassButton>
            </Link>
          </div>
          {recentCallSessions && recentCallSessions.length > 0 ? (
            <div className="space-y-3">
              {recentCallSessions.map((session: any) => {
                const isCoach = session.coach_profile?.id === user.id;
                const otherPerson = isCoach ? session.attendee_profile : session.coach_profile;
                return (
                  <div
                    key={session.id}
                    className="block p-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{session.voice_channel?.channel_name || 'Voice Channel'}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'terminated' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{isCoach ? 'Attendee' : 'Coach'}: {otherPerson?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{session.duration_minutes || 0} min</span>
                          <span>•</span>
                          <span className="font-semibold text-gray-900">${session.total_cost?.toFixed(2) || '0.00'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No call sessions yet. Set up voice channels in Settings to start coaching!
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
