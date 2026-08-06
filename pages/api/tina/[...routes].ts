import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer';
import { jwtVerify } from 'jose';
import databaseClient from '../../../tina/__generated__/databaseClient';
import { isAllowedAdmin } from '../../../lib/admin';

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

function cleanEmptyCourseFolders() {
  const contentRoot = path.join(process.cwd(), 'content', 'docs');
  if (!fs.existsSync(contentRoot)) return;

  try {
    const dirs = fs.readdirSync(contentRoot, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory() && dir.name !== 'setup' && !dir.name.startsWith('.')) {
        const folderPath = path.join(contentRoot, dir.name);
        const files = fs.readdirSync(folderPath);
        const mdxFiles = files.filter((f) => f.endsWith('.mdx') && !f.startsWith('.'));
        if (mdxFiles.length === 0) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      }
    }
  } catch (e) {}
}

export default async function tinaBackend(req: NextApiRequest, res: NextApiResponse) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        req.body = req.body.replace(/\\\\/g, '/');
      } catch {}
    } else if (typeof req.body === 'object') {
      try {
        const bodyStr = JSON.stringify(req.body).replace(/\\\\/g, '/');
        req.body = JSON.parse(bodyStr);
      } catch {}
    }
  }

  const result = await handler(req, res);
  cleanEmptyCourseFolders();
  return result;
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '12mb' },
  },
};
