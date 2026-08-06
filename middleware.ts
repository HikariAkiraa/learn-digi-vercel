import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Route-level gate for everything CMS-related.
 *
 * Note this also covers /admin/index.html and /admin/assets/* — the static SPA
 * that `tinacms build` writes into public/. Middleware runs before public files
 * are served, so an unauthenticated visitor cannot bypass the rewrite by
 * requesting the .html directly.
 *
 * This is the outer perimeter only. The Tina GraphQL backend independently
 * verifies a signed token on every mutation (see pages/api/tina/[...routes].ts)
 * — losing this middleware would not by itself let anyone write content.
 */
export default auth((req) => {
  if (req.auth?.user?.isAdmin === true) return;

  const { pathname, search, origin } = req.nextUrl;

  // API routes get a JSON 401 — redirecting a POST to an HTML login page
  // produces an unreadable error in the Tina client.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Admin access required.' },
      { status: 401 },
    );
  }

  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('callbackUrl', pathname + search);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/tina/:path*', '/api/cms-token'],
};
