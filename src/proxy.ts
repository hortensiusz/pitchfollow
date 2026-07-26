import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple shared-token gate. Override with the AUTH_TOKEN env var on Vercel.
const TOKEN = process.env.AUTH_TOKEN || 'ChambersSha2026';
const COOKIE = 'pf_auth';

// Next 16: middleware is called "proxy" (proxy.ts). Same functionality.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths: the login page and the login endpoint must be reachable.
  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const authed = request.cookies.get(COOKIE)?.value === TOKEN;
  if (authed) return NextResponse.next();

  // Unauthenticated API calls get a clean 401 (no HTML redirect).
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Unauthenticated page requests go to the login screen.
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname && pathname !== '/' ? `?from=${encodeURIComponent(pathname)}` : '';
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and the favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
