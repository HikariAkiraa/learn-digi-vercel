/**
 * Single source of truth for "who is an admin".
 *
 * The whitelist lives *only* in the ALLOWED_ADMIN_EMAILS env var. There is no
 * user table, no roles, no Tina users collection to keep in sync — everyone on
 * the list has identical full-admin rights, per the spec.
 *
 * This module is imported from the edge middleware, from React Server
 * Components, and from the Node-runtime Tina backend, so it must stay free of
 * any runtime-specific imports (no `fs`, no `next/headers`).
 */

/** Parse ALLOWED_ADMIN_EMAILS into a normalised list. */
export function getAllowedAdmins(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Fails closed: an unset or empty ALLOWED_ADMIN_EMAILS grants nobody access.
 * A typo in the env var locks everyone out rather than letting everyone in.
 */
export function isAllowedAdmin(email?: string | null): boolean {
  if (!email) return false;

  const allowed = getAllowedAdmins();
  if (allowed.length === 0) return false;

  return allowed.includes(email.trim().toLowerCase());
}
