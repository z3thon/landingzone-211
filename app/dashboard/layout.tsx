import { getCurrentUser, getProfile } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Get full profile data
  const profile = await getProfile(user.id);
  const supabase = createServiceRoleClient();

  // Get token balance
  const { data: tokenBalanceData } = await supabase
    .from('token_balances')
    .select('balance_usd')
    .eq('profile_id', user.id)
    .single();

  const typedProfile = profile as { name?: string; avatar_url?: string } | null;
  const tokenBalance = tokenBalanceData as { balance_usd: number } | null;

  return (
    <DashboardLayout
      user={{
        id: user.id,
        email: user.email,
        name: typedProfile?.name,
        avatar_url: typedProfile?.avatar_url,
      }}
      tokenBalance={tokenBalance?.balance_usd || 0}
    >
      {children}
    </DashboardLayout>
  );
}
