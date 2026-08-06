import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Pencil } from 'lucide-react';
import { getCourses, Course } from '@/lib/courses';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { DeleteCourseButton } from '@/components/delete-course-button';
import { CreateCourseModal } from '@/components/create-course-modal';
import { FadeInSection } from '@/components/scroll-animations';

export const metadata: Metadata = {
  title: 'Laboratory Courses',
  description: 'Full list of digital laboratory courses.',
};

async function AdminCourseActions({ course }: { course: Course }) {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) return null;

  return (
    <div className="flex items-center gap-1">
      <CreateCourseModal
        initialCourse={{
          slug: course.slug,
          title: course.title,
          description: course.description,
          icon: course.iconName,
          image: course.image,
          level: course.level,
          accent: course.accent,
        }}
        triggerButton={
          <button
            type="button"
            className="rounded-full p-1.5 text-fd-muted-foreground hover:bg-brand-gold/20 hover:text-brand-gold transition-colors cursor-pointer"
            title="Edit course details"
          >
            <Pencil className="size-3.5" />
          </button>
        }
      />
      <DeleteCourseButton slug={course.slug} title={course.title} />
    </div>
  );
}

async function AdminCreateCourseButton() {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) return null;

  return <CreateCourseModal />;
}

export default function CoursesPage() {
  const courses = getCourses();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-[calc(var(--spacing)*5)] pb-16">
      <FadeInSection direction="bottom" delay={0}>
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              Laboratory Courses
            </h1>
            <p className="mt-4 text-lg text-fd-muted-foreground">
              Select a laboratory course to open its module list. Each card links directly
              to the corresponding laboratory documentation.
            </p>
          </div>
          <Suspense fallback={null}>
            <AdminCreateCourseButton />
          </Suspense>
        </header>
      </FadeInSection>

      <FadeInSection direction="bottom" delay={150}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.slug}
            className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-6 text-center transition-all hover:-translate-y-1 ${course.hoverBorder} hover:shadow-[var(--shadow-elegant)]`}
          >
            <Link
              href={course.href}
              className="absolute inset-0 z-0"
              aria-label={course.title}
            />

            <span
              className={`absolute inset-x-0 top-0 h-1 ${course.accent} opacity-70 transition-opacity group-hover:opacity-100 pointer-events-none`}
              aria-hidden
            />

            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 pointer-events-auto">
              <span className="rounded-full border border-fd-border bg-fd-background/80 px-2.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground backdrop-blur-sm pointer-events-none">
                {course.level}
              </span>
              <Suspense fallback={null}>
                <AdminCourseActions course={course} />
              </Suspense>
            </div>

            <div className="mt-4 mb-5 flex size-28 shrink-0 items-center justify-center rounded-full border-2 border-brand-gold/30 bg-gradient-to-b from-fd-accent/60 to-fd-background p-3 shadow-inner transition-transform group-hover:scale-105 pointer-events-none">
              {course.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={course.image}
                  alt={course.title}
                  className="size-20 object-contain drop-shadow-sm"
                />
              ) : (
                <course.icon className="size-12 text-fd-primary" aria-hidden />
              )}
            </div>

            <h2 className="font-display text-xl font-bold leading-snug text-fd-card-foreground transition-colors group-hover:text-fd-primary pointer-events-none">
              {course.title}
            </h2>
            <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fd-muted-foreground line-clamp-3 pointer-events-none">
              {course.description}
            </p>

            <div className="mt-6 flex w-full items-center justify-between border-t border-fd-border pt-3.5 text-xs pointer-events-none">
              <span className="font-medium text-fd-muted-foreground">{course.modules} Modules</span>
              <span className="inline-flex items-center gap-1 font-semibold text-fd-primary">
                Explore Course
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </div>
          </div>
        ))}
        </div>
      </FadeInSection>
    </main>
  );
}
