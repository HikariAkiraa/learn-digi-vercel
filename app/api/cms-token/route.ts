import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const CMS_TOKEN_ISSUER = 'learn-digi';
export const CMS_TOKEN_AUDIENCE = 'tina-backend';

/**
 * Mints the short-lived bearer token the TinaCMS browser client presents to the
 * Tina GraphQL backend.
 *
 * Why a separate token instead of just reading the NextAuth session cookie in
 * the backend: the Tina backend is a Node handler that receives a raw
 * IncomingMessage, and NextAuth's cookie name and encryption differ between
 * major versions. A token we sign ourselves, with an explicit issuer/audience,
 * is stable, verifiable in one line, and independent of NextAuth internals.
 *
 * 15-minute lifetime: short enough that removing someone from
 * ALLOWED_ADMIN_EMAILS takes effect quickly, long enough that an editor is not
 * interrupted mid-document. The backend re-checks the whitelist on every
 * request anyway, so the real revocation window is one request, not 15 minutes.
 */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!isAllowedAdmin(email)) {
    return NextResponse.json(
      { error: 'not_authorized', message: 'This account is not on ALLOWED_ADMIN_EMAILS.' },
      { status: 401 },
    );
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'server_misconfigured', message: 'AUTH_SECRET is not set.' },
      { status: 500 },
    );
  }

  const token = await new SignJWT({ email, scope: 'tina:admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email as string)
    .setIssuer(CMS_TOKEN_ISSUER)
    .setAudience(CMS_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json(
    {
      token,
      user: {
        email,
        name: session?.user?.name ?? email,
        image: session?.user?.image ?? null,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
