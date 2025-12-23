import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ success: true });
  deleteSession(response);
  return response;
}
