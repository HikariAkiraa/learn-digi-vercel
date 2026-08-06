import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { CircuitBoard } from 'lucide-react';
import { AdminNavButton } from '@/components/admin-nav-button';

/**
 * Shared navbar/layout options.
 *
 * Kept minimal on purpose: home link, search, Courses, theme switch, admin
 * button. Fumadocs renders the search trigger and theme switch itself; we only
 * add the two items it does not know about.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <CircuitBoard className="size-5 text-fd-primary" aria-hidden />
          <span className="font-semibold tracking-tight">
            Learn<span className="text-fd-primary">Digi</span>
          </span>
        </>
      ),
      url: '/',
      transparentMode: 'top',
    },
    links: [
      {
        type: 'main',
        text: 'Courses',
        url: '/courses',
      },
      {
        type: 'main',
        text: 'Modul',
        url: '/docs',
      },
      {
        // Rendered on the right-hand side of the navbar, next to the theme
        // toggle. Client component so the docs pages stay statically rendered.
        type: 'custom',
        secondary: true,
        children: <AdminNavButton />,
      },
    ],
    themeSwitch: {
      enabled: true,
      mode: 'light-dark-system',
    },
  };
}
