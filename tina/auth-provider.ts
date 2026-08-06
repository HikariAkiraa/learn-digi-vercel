import { AbstractAuthProvider } from 'tinacms';

/**
 * Browser-side auth provider for the Tina admin SPA.
 *
 * It owns no credentials of its own. Everything routes through NextAuth:
 *   - /login              -> Google OAuth, gated by the signIn callback
 *   - /api/cms-token      -> mints a 15-minute signed bearer token, but only
 *                            for emails in ALLOWED_ADMIN_EMAILS
 *
 * So "is this person an admin" is answered in exactly one place — the env var —
 * and this class just carries the answer to the Tina backend.
 */

const TOKEN_ENDPOINT = '/api/cms-token';
const ADMIN_ENTRY = '/admin/index.html';

interface CmsTokenResponse {
  token: string;
  user: { email: string; name: string; image: string | null };
}

export class WhitelistAuthProvider extends AbstractAuthProvider {
  private async fetchToken(): Promise<CmsTokenResponse | null> {
    try {
      const res = await fetch(TOKEN_ENDPOINT, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return null;
      return (await res.json()) as CmsTokenResponse;
    } catch {
      return null;
    }
  }

  /** Called when Tina decides the visitor is not logged in. */
  async authenticate(): Promise<void> {
    const callbackUrl = encodeURIComponent(ADMIN_ENTRY);
    window.location.href = `/login?callbackUrl=${callbackUrl}`;
  }

  /** Sent to the Tina backend as `Authorization: Bearer <id_token>`. */
  async getToken(): Promise<{ id_token: string }> {
    const data = await this.fetchToken();
    return { id_token: data?.token ?? '' };
  }

  /** Truthy = logged in. Falsy = Tina calls authenticate(). */
  async getUser() {
    const data = await this.fetchToken();
    return data?.user ?? false;
  }

  async logout(): Promise<void> {
    window.location.href = '/api/auth/signout?callbackUrl=/';
  }

  /**
   * Authorization already happened server-side: /api/cms-token returns 401 for
   * anyone not on the whitelist, so getUser() would have been falsy. Returning
   * true here avoids a redundant round trip.
   */
  async authorize(): Promise<boolean> {
    return true;
  }
}
