import { SquarePen } from 'lucide-react';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { tinaEditUrl } from '@/lib/tina-edit-url';

/**
 * "Edit in CMS" — server-rendered, whitelist-gated.
 *
 * This is an async Server Component. The session is read on the server and the
 * anchor is never sent to the client for a non-admin: a visitor who views
 * source sees nothing, not a hidden element. `isAllowedAdmin` re-reads
 * ALLOWED_ADMIN_EMAILS on every render, so removing an address takes effect on
 * the next request.
 *
 * Rendering cost: calling auth() reads cookies, which opts the route out of
 * static rendering. Wrapping this component in <Suspense> plus
 * `experimental.ppr` in next.config.mjs keeps the surrounding page prerendered
 * and streams only this button. See IMPLEMENTATION_PLAN.md.
 */
export async function EditInCms({ path }: { path: string }) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) return null;

  return (
    <a
      href={tinaEditUrl(path)}
      className="inline-flex items-center gap-2 rounded-md border border-brand-gold/40 bg-brand-gold/10 px-3 py-1.5 text-sm font-medium text-brand-gold-ink transition-colors hover:bg-brand-gold/20 dark:text-brand-beige"
    >
      <SquarePen className="size-4" aria-hidden />
      Edit di CMS
    </a>
  );
}

/**
 * Shown above a draft document so an editor previewing locally cannot mistake
 * it for a published page.
 */
export function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-fd-warning/45 bg-fd-warning/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-fd-warning">
      Draft — tidak tayang
    </span>
  );
}
