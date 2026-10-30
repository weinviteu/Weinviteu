import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authClient } from '@/lib/admin';

export async function POST(request: Request) {
  const input = z.object({ username: z.email(), password: z.string().min(1).max(1024) }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  const db = authClient();
  const { data, error } = await db.auth.signInWithPassword({ email: input.data.username, password: input.data.password });
  if (error || !data.session || data.user?.app_metadata?.role !== 'admin') {
    if (data.session) await db.auth.signOut();
    return NextResponse.json({ error: 'Invalid administrator credentials.' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_access', data.session.access_token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    maxAge: data.session.expires_in, path: '/',
  });
  response.cookies.delete('admin_auth');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_access');
  response.cookies.delete('admin_auth');
  return response;
}
