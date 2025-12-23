import { createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export interface CurrentUser {
  id: string;
  email?: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await getSession();
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    return {
      id: session.userId,
      email: session.email,
    };
  } catch (error: any) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

export async function getProfile(userId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createProfile(userId: string, profileData: {
  name: string;
  email?: string;
}) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: profileData.name,
      email: profileData.email,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
}
