import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Password management is handled through Discord OAuth
    // Users authenticate via Discord, so password changes are managed through Discord
    return NextResponse.json({ 
      success: false,
      message: 'Password management is not available. Your account is authenticated through Discord. To change your password, please update it in your Discord account settings.'
    }, { status: 400 });
  } catch (error) {
    console.error('Password API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
