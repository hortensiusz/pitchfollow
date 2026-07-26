import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TOKEN = process.env.AUTH_TOKEN || 'ChambersSha2026';
const COOKIE = 'pf_auth';

export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token || token !== TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
