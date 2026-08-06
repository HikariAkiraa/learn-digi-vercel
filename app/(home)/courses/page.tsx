import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { courses } from '@/lib/courses';

export const metadata: Metadata = {
  title: 'Mata Praktikum',
  description: 'Daftar seluruh mata praktikum Laboratorium Digital.',
};

export default function CoursesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow text-sm text-brand-gold-ink dark:text-brand-gold">
          Kurikulum
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
          Mata Praktikum
        </h1>
        <p className="mt-4 text-lg text-fd-muted-foreground">
          Pilih mata praktikum untuk membuka daftar modulnya. Setiap kartu
          mengarah langsung ke halaman dokumentasi Fumadocs terkait.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/docs/${course.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card p-6 transition-all hover:-translate-y-0.5 hover:border-fd-primary/50 hover:shadow-[var(--shadow-elegant)]"
          >
            <span
              className={`absolute inset-x-0 top-0 h-0.5 ${course.accent} opacity-60 transition-opacity group-hover:opacity-100`}
              aria-hidden
            />

            <div className="mb-5 flex items-start justify-between gap-3">
              <course.icon className="size-7 text-fd-primary" aria-hidden />
              <span className="rounded border border-fd-border px-2 py-0.5 text-xs text-fd-muted-foreground">
                {course.level}
              </span>
            </div>

            <h2 className="font-display text-xl font-semibold leading-snug text-fd-card-foreground">
              {course.title}
            </h2>
            <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fd-muted-foreground">
              {course.description}
            </p>

            <p className="mt-5 flex items-center justify-between border-t border-fd-border pt-4 text-sm">
              <span className="text-fd-muted-foreground">{course.modules} modul</span>
              <span className="inline-flex items-center gap-1 font-medium text-fd-primary">
                Buka
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
