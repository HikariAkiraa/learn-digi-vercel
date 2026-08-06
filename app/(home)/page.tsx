import Link from 'next/link';
import { FullSearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  Download,
  ShieldCheck,
  TerminalSquare,
  Wrench,
} from 'lucide-react';
import { courses } from '@/lib/courses';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <div className="rule-gold mx-auto w-full max-w-6xl" />
      <CoursesSection />
      <div className="rule-gold mx-auto w-full max-w-6xl" />
      <ToolsSection />
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-20 pt-24 text-center sm:pt-32">
        <p className="eyebrow mb-5 text-sm text-fd-muted-foreground">
          Laboratorium Digital · Dokumentasi Praktikum
        </p>

        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-fd-foreground sm:text-6xl">
          Semua modul praktikum,
          <br />
          <span className="text-fd-primary">satu tempat.</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg text-fd-muted-foreground">
          Panduan langkah demi langkah, prosedur operasi standar, dan catatan alat
          untuk setiap mata praktikum — selalu versi terbaru.
        </p>

        {/*
          FullSearchTrigger opens the same Fumadocs search dialog as Cmd/Ctrl+K.
          Reusing it means the hero search and the navbar search share one index
          and one keyboard shortcut — no second search implementation to drift.
        */}
        <div className="mt-9 w-full max-w-lg">
          <FullSearchTrigger className="w-full rounded-lg border border-fd-border bg-fd-card px-4 py-3 text-left shadow-[var(--shadow-elegant)] transition-colors hover:border-fd-primary/50" />
        </div>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/docs"
            className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-transform hover:-translate-y-px"
          >
            Mulai Belajar
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
          >
            <BookOpenCheck className="size-4" aria-hidden />
            Lihat Semua Mata Praktikum
          </Link>
        </div>

        <dl className="mt-14 grid w-full grid-cols-3 gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border">
          <Stat value={String(courses.length)} label="Mata praktikum" />
          <Stat
            value={String(courses.reduce((sum, course) => sum + course.modules, 0))}
            label="Modul"
          />
          <Stat value="Git" label="Riwayat revisi" />
        </dl>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-fd-background px-4 py-5">
      <dt className="font-display text-2xl font-semibold text-fd-foreground">{value}</dt>
      <dd className="mt-0.5 text-xs text-fd-muted-foreground">{label}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CoursesSection() {
  return (
    <section id="courses" className="mx-auto w-full max-w-6xl px-4 py-20">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-sm text-brand-gold-ink dark:text-brand-gold">
            Kurikulum
          </p>
          <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
            Mata Praktikum
          </h2>
        </div>
        <Link
          href="/courses"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary"
        >
          Semua mata praktikum
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.slice(0, 6).map((course) => (
          <Link
            key={course.slug}
            href={`/docs/${course.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card p-5 transition-all hover:-translate-y-0.5 hover:border-fd-primary/50 hover:shadow-[var(--shadow-elegant)]"
          >
            <span
              className={`absolute inset-x-0 top-0 h-0.5 ${course.accent} opacity-60 transition-opacity group-hover:opacity-100`}
              aria-hidden
            />

            <course.icon className="mb-4 size-6 text-fd-primary" aria-hidden />

            <h3 className="font-display text-lg font-semibold leading-snug text-fd-card-foreground">
              {course.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-fd-muted-foreground">
              {course.description}
            </p>

            <p className="mt-4 flex items-center gap-2 text-xs text-fd-muted-foreground">
              <span className="rounded border border-fd-border px-1.5 py-0.5">
                {course.level}
              </span>
              <span>{course.modules} modul</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const toolLinks = [
  {
    icon: Download,
    title: 'Instalasi Perangkat Lunak',
    body: 'Toolchain simulasi, IDE, dan driver board — beserta versi yang dipakai di lab.',
    href: '/docs/setup/instalasi',
  },
  {
    icon: TerminalSquare,
    title: 'Konfigurasi Lingkungan',
    body: 'Variabel environment, akses serial port, dan pemeriksaan instalasi.',
    href: '/docs/setup/lingkungan',
  },
  {
    icon: ClipboardList,
    title: 'SOP Praktikum',
    body: 'Alur sebelum, selama, dan sesudah praktikum. Termasuk format laporan.',
    href: '/docs/setup/sop',
  },
  {
    icon: ShieldCheck,
    title: 'Keselamatan Kerja (K3)',
    body: 'Penanganan alat bertegangan, ESD, dan prosedur saat terjadi insiden.',
    href: '/docs/setup/k3',
  },
];

function ToolsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <header className="mb-10">
        <p className="eyebrow text-sm text-brand-gold-ink dark:text-brand-gold">
          Sebelum mulai
        </p>
        <h2 className="font-display mt-1 flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
          <Wrench className="size-6 text-fd-primary" aria-hidden />
          Alat &amp; Persiapan Lingkungan
        </h2>
        <p className="mt-3 max-w-2xl text-fd-muted-foreground">
          Selesaikan bagian ini sekali di awal semester. Modul praktikum
          mengasumsikan semuanya sudah terpasang.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {toolLinks.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex gap-4 rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
          >
            <tool.icon
              className="mt-0.5 size-5 shrink-0 text-brand-gold-ink dark:text-brand-gold"
              aria-hidden
            />
            <div>
              <h3 className="font-semibold text-fd-card-foreground">{tool.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
                {tool.body}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
