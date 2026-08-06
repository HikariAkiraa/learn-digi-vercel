import type { NextApiRequest, NextApiResponse } from 'next';
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer';
import { jwtVerify } from 'jose';
import databaseClient from '../../../tina/__generated__/databaseClient';
import { isAllowedAdmin } from '../../../lib/admin';

/**
 * The Tina backend: GraphQL, media, and authorization in one handler.
 *
 * Why this lives in pages/api rather than app/api: TinaNodeBackend returns a
 * Node-style (req, res) handler. App Router route handlers speak Web
 * Request/Response, so mounting it there means writing and maintaining a
 * body-streaming adapter for no benefit. Next.js runs both routers in the same
 * app; this is the only Pages Router file in the project.
 *
 * This is the real authorization boundary. middleware.ts also gates
 * /api/tina/*, but if that were misconfigured tomorrow, isAuthorized below
 * would still reject every unsigned or non-whitelisted request.
 */

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

const CMS_TOKEN_ISSUER = 'learn-digi';
const CMS_TOKEN_AUDIENCE = 'tina-backend';

function WhitelistBackendAuth() {
  return {
    isAuthorized: async (req: { headers: Record<string, unknown> }) => {
      const header = String(req.headers.authorization ?? '');
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

      if (!token) {
        return {
          isAuthorized: false as const,
          errorMessage: 'Missing bearer token.',
          errorCode: 401,
        };
      }

      const secret = process.env.AUTH_SECRET;
      if (!secret) {
        return {
          isAuthorized: false as const,
          errorMessage: 'Server misconfigured: AUTH_SECRET is not set.',
          errorCode: 500,
        };
      }

      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(secret),
          { issuer: CMS_TOKEN_ISSUER, audience: CMS_TOKEN_AUDIENCE },
        );

        // Re-read the whitelist here, not just at sign-in. Deleting an address
        // from ALLOWED_ADMIN_EMAILS and redeploying revokes write access
        // immediately, even for a token issued seconds earlier.
        if (!isAllowedAdmin(payload.email as string | undefined)) {
          return {
            isAuthorized: false as const,
            errorMessage: 'This account is not on ALLOWED_ADMIN_EMAILS.',
            errorCode: 403,
          };
        }

        return { isAuthorized: true as const };
      } catch {
        return {
          isAuthorized: false as const,
          errorMessage: 'Invalid or expired CMS token.',
          errorCode: 401,
        };
      }
    },
  };
}

const handler = TinaNodeBackend({
  authProvider: isLocal ? LocalBackendAuthProvider() : WhitelistBackendAuth(),
  databaseClient,
});

export default function tinaBackend(req: NextApiRequest, res: NextApiResponse) {
  return handler(req, res);
}

export const config = {
  api: {
    // Image uploads through Tina's repo-based media go through this route.
    bodyParser: { sizeLimit: '12mb' },
  },
};
