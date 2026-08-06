import { createDatabase, createLocalDatabase } from '@tinacms/datalayer';
import { GitHubProvider } from 'tinacms-gitprovider-github';
import { RedisLevel } from 'upstash-redis-level';

/**
 * Self-hosted Tina data layer.
 *
 * Two halves:
 *   - gitProvider     — where saved content is committed (your GitHub repo).
 *                       The commit is what triggers the Vercel deploy, which is
 *                       what publishes a draft.
 *   - databaseAdapter — Tina's content *index*, used to answer GraphQL queries
 *                       without cloning the repo on every request. It is a
 *                       cache, not the source of truth; the MDX in git is.
 *
 * Locally, `createLocalDatabase()` replaces both with an in-memory index over
 * the filesystem, so `npm run dev` needs no Redis and no GitHub token.
 */

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

const branch =
  process.env.GITHUB_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? 'main';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[tina/database] Missing required env var ${name}. ` +
        'Set it in .env.local and in your Vercel project settings.',
    );
  }
  return value;
}

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner: requireEnv('GITHUB_OWNER'),
        repo: requireEnv('GITHUB_REPO'),
        token: requireEnv('GITHUB_PERSONAL_ACCESS_TOKEN'),
      }),
      databaseAdapter: new RedisLevel<string, Record<string, unknown>>({
        redis: {
          url: requireEnv('KV_REST_API_URL'),
          token: requireEnv('KV_REST_API_TOKEN'),
        },
        debug: process.env.DEBUG === 'true',
        // Namespacing by branch keeps preview branches from clobbering
        // production's index.
        namespace: branch,
      }),
    });
