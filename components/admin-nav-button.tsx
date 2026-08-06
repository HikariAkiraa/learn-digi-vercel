'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

type State = { status: 'loading' } | { status: 'authenticated' } | { status: 'unauthenticated' };

/**
 * Navbar auth control.
 *
 * Client component to keep pages statically rendered.
 * Shows "Sign In" when unauthenticated, and "Sign Out" when logged in.
 */
export function AdminNavButton() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (cancelled) return;
        setState(session?.user ? { status: 'authenticated' } : { status: 'unauthenticated' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unauthenticated' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <div className="h-8 w-20 animate-pulse rounded-md bg-fd-muted" aria-hidden />;
  }

  if (state.status === 'authenticated') {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="admin-nav-btn inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        <LogOut className="size-4" aria-hidden />
        Sign Out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="admin-nav-btn inline-flex items-center gap-1.5 rounded-md border border-fd-border px-3 py-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:border-fd-primary/50 hover:text-fd-foreground"
    >
      <LogIn className="size-4" aria-hidden />
      Sign In
    </Link>
  );
}
