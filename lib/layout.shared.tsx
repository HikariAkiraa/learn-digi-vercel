import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { AdminNavButton } from '@/components/admin-nav-button';
import { BrandLogo } from '@/components/brand-logo';

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
          <BrandLogo className="size-6" />
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
        text: 'Resources',
        url: '/resources',
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
      enabled: false,
    },
  };
}
