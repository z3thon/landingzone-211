import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error('SESSION_SECRET environment variable is required. Please set it in your .env.local file.');
}
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email?: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  // Convert Date to ISO string for JWT serialization
  const jwtPayload = {
    userId: payload.userId,
    email: payload.email,
    expiresAt: payload.expiresAt.toISOString(),
  };
  return await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(session: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    const typedPayload = payload as { userId: string; email?: string; expiresAt: string };
    return {
      userId: typedPayload.userId,
      email: typedPayload.email,
      expiresAt: new Date(typedPayload.expiresAt),
    };
  } catch (error) {
    console.error('Session decryption error:', error);
    return null;
  }
}

export async function createSession(userId: string, email?: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, email, expiresAt });
  return session;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  return await decrypt(sessionCookie.value);
}

export async function setSessionCookie(response: NextResponse, session: string) {
  response.cookies.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function deleteSession(response: NextResponse) {
  response.cookies.delete('session');
}
