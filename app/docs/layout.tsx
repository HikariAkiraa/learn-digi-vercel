import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source, draftSource } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { AdminSidebarBanner } from '@/components/admin-sidebar';

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isAdmin = isAllowedAdmin(session?.user?.email);
  const targetSource = isAdmin ? draftSource : source;

  return (
    <DocsLayout
      tree={targetSource.pageTree}
      {...baseOptions()}
      sidebar={{
        defaultOpenLevel: 1,
        banner: isAdmin ? <AdminSidebarBanner /> : undefined,
      }}
    >
      {children}
    </DocsLayout>
  );
}
