import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CircuitBoard, ShieldCheck } from 'lucide-react';
import { auth, signIn } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Masuk Admin',
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <main className="relative flex flex-1 items-center justify-center px-4 py-24">
          <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative w-full max-w-sm rounded-xl border border-fd-border bg-fd-card p-8 shadow-[var(--shadow-elegant)]">
            <CircuitBoard className="size-8 text-fd-primary animate-pulse" aria-hidden />
            <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight">
              Masuk sebagai Admin
            </h1>
          </div>
        </main>
      }
    >
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const { callbackUrl = '/admin', error } = await searchParams;

  const session = await auth();
  if (session?.user?.isAdmin) redirect(callbackUrl);

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-24">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative w-full max-w-sm rounded-xl border border-fd-border bg-fd-card p-8 shadow-[var(--shadow-elegant)]">
        <CircuitBoard className="size-8 text-fd-primary" aria-hidden />

        <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight">
          Masuk sebagai Admin
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
          Akses CMS dibatasi pada daftar email yang disetujui. Gunakan akun
          Google yang terdaftar.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-fd-error/45 bg-fd-error/10 px-3 py-2.5 text-sm text-fd-error"
          >
            {error === 'AccessDenied'
              ? 'Akun tersebut tidak ada dalam daftar admin. Hubungi pengelola lab untuk ditambahkan.'
              : 'Gagal masuk. Silakan coba lagi.'}
          </p>
        ) : null}

        <form
          className="mt-6"
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-transform hover:-translate-y-px"
          >
            <GoogleMark />
            Lanjutkan dengan Google
          </button>
        </form>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-fd-muted-foreground">
          <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden />
          Daftar admin dikelola lewat variabel environment
          <code className="mx-1">ALLOWED_ADMIN_EMAILS</code>. Tidak ada
          pendaftaran mandiri.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12.24 10.29v3.63h5.13c-.21 1.33-1.55 3.9-5.13 3.9-3.09 0-5.61-2.56-5.61-5.71s2.52-5.71 5.61-5.71c1.76 0 2.94.75 3.61 1.39l2.46-2.37C16.71 3.7 14.66 2.8 12.24 2.8 7.15 2.8 3 6.93 3 12s4.15 9.2 9.24 9.2c5.34 0 8.88-3.75 8.88-9.04 0-.61-.07-1.07-.15-1.53z"
      />
    </svg>
  );
}
