import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { isAllowedAdmin } from '@/lib/admin';

/**
 * NextAuth (Auth.js v5) configuration.
 *
 * Deliberately edge-safe: this module is imported by middleware.ts, so it must
 * not pull in anything Node-only. The Google provider and lib/admin both
 * qualify. A JWT session strategy is used because there is no database.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Always show the account chooser — lab machines are shared.
          prompt: 'select_account',
        },
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    /**
     * Gate 1 — at sign-in. A non-whitelisted Google account never gets a
     * session cookie at all.
     */
    async signIn({ profile }) {
      if (profile?.email_verified !== true) return false;
      return isAllowedAdmin(profile.email);
    },

    /**
     * Gate 2 — on every request. Re-evaluating the whitelist here (rather than
     * baking it in once at sign-in) means removing an address from
     * ALLOWED_ADMIN_EMAILS revokes access on the *next request*, without
     * waiting for the JWT to expire or asking the user to sign out.
     */
    async jwt({ token }) {
      token.isAdmin = isAllowedAdmin(token.email);
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin === true;
      }
      return session;
    },
  },

  trustHost: true,
});
