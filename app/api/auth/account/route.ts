import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmText } = body;

    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text must be "DELETE"' },
        { status: 400 }
      );
    }

    // Delete from database (cascade will handle related data)
    const supabase = createServiceRoleClient();
    
    // Delete profile (cascade will delete all related records including discord_users)
    const { error: supabaseError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (supabaseError) {
      console.error('Error deleting profile:', supabaseError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
