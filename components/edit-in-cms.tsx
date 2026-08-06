import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { EditModuleButton } from '@/components/edit-module-button';
import { DeleteModuleButton } from '@/components/delete-module-button';

/**
 * "Edit Module" & "Delete Module" — server-rendered, whitelist-gated.
 *
 * Launches the native HackMD-style Split MDX Editor or deletes module directly.
 */
export async function EditInCms({ path }: { path: string }) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) return null;

  return (
    <div className="flex items-center gap-2">
      <EditModuleButton path={path} />
      <DeleteModuleButton path={path} />
    </div>
  );
}

/**
 * Shown above a draft document so an editor previewing locally cannot mistake
 * it for a published page.
 */
export function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-fd-warning/45 bg-fd-warning/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-fd-warning">
      Draft — Unpublished
    </span>
  );
}
