'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, PencilRuler } from 'lucide-react';

type State = { status: 'loading' } | { status: 'admin' } | { status: 'anon' };

/**
 * Navbar auth control.
 *
 * This is a client component so that reading the session does NOT force every
 * page in the app into dynamic rendering. The cost is a brief skeleton on first
 * paint; the benefit is that the landing page, /courses and all /docs pages
 * stay statically prerendered.
 *
 * It is a convenience affordance, not a security control — /admin is gated by
 * middleware.ts and the Tina backend regardless of what this renders.
 */
export function AdminNavButton() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (cancelled) return;
        setState(session?.user?.isAdmin ? { status: 'admin' } : { status: 'anon' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'anon' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <div className="h-8 w-20 animate-pulse rounded-md bg-fd-muted" aria-hidden />;
  }

  if (state.status === 'admin') {
    return (
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        <PencilRuler className="size-4" aria-hidden />
        CMS
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-3 py-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:border-fd-primary/50 hover:text-fd-foreground"
    >
      <LogIn className="size-4" aria-hidden />
      Admin
    </Link>
  );
}
