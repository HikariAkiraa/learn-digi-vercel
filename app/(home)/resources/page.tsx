import type { Metadata } from 'next';
import { Download, Pencil, Paperclip } from 'lucide-react';
import { getResources, Resource } from '@/lib/resources';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { CreateResourceModal } from '@/components/create-resource-modal';
import { DeleteResourceButton } from '@/components/delete-resource-button';
import { FadeInSection } from '@/components/scroll-animations';

export const metadata: Metadata = {
  title: 'Laboratory Resources',
  description: 'Download software packages, installers, SOP documentations, and practicum report templates.',
};

async function AdminResourceActions({ resource }: { resource: Resource }) {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) return null;

  return (
    <div className="flex items-center gap-1">
      <CreateResourceModal
        initialResource={{
          id: resource.id,
          title: resource.title,
          description: resource.description,
          fileUrl: resource.fileUrl,
          fileName: resource.fileName,
          fileSize: resource.fileSize,
          category: resource.category,
          accent: resource.accent,
          icon: resource.iconName,
        }}
        triggerButton={
          <button
            type="button"
            className="rounded-full p-1.5 text-fd-muted-foreground hover:bg-brand-gold/20 hover:text-brand-gold transition-colors cursor-pointer"
            title="Edit resource details"
          >
            <Pencil className="size-3.5" />
          </button>
        }
      />
      <DeleteResourceButton id={resource.id} title={resource.title} />
    </div>
  );
}

async function AdminCreateResourceButton() {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) return null;

  return <CreateResourceModal />;
}

export default function ResourcesPage() {
  const resources = getResources();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-[calc(var(--spacing)*5)] pb-16">
      <FadeInSection direction="bottom" delay={0}>
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              Laboratory Resources
            </h1>
            <p className="mt-4 text-lg text-fd-muted-foreground">
              Download software packages, simulation tools, standard operating procedures, and practicum templates for digital laboratory sessions.
            </p>
          </div>
          <Suspense fallback={null}>
            <AdminCreateResourceButton />
          </Suspense>
        </header>
      </FadeInSection>

      <FadeInSection direction="bottom" delay={150}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((res) => {
          const IconComp = res.icon;
          return (
            <div
              key={res.id}
              className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-6 text-center transition-all hover:-translate-y-1 ${res.hoverBorder} hover:shadow-[var(--shadow-elegant)]`}
            >
              {/* Direct file download trigger on card click */}
              <a
                href={res.fileUrl}
                download={res.fileName || true}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-0"
                aria-label={`Download ${res.title}`}
              />

              {/* Accent Rail */}
              <span
                className={`absolute inset-x-0 top-0 h-1 ${res.accent} opacity-70 transition-opacity group-hover:opacity-100 pointer-events-none`}
                aria-hidden
              />

              {/* Top-Right Badge & Admin Actions */}
              <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 pointer-events-auto">
                <span className="rounded-full border border-fd-border bg-fd-background/80 px-2.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground backdrop-blur-sm pointer-events-none">
                  {res.category}
                </span>
                <Suspense fallback={null}>
                  <AdminResourceActions resource={res} />
                </Suspense>
              </div>

              {/* Document / File Icon Avatar */}
              <div className="mt-4 mb-5 flex size-28 shrink-0 items-center justify-center rounded-full border-2 border-brand-gold/30 bg-gradient-to-b from-fd-accent/60 to-fd-background p-3 shadow-inner transition-transform group-hover:scale-105 pointer-events-none">
                <IconComp className="size-12 text-fd-primary" aria-hidden />
              </div>

              <h2 className="font-display text-xl font-bold leading-snug text-fd-card-foreground transition-colors group-hover:text-fd-primary pointer-events-none">
                {res.title}
              </h2>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fd-muted-foreground line-clamp-3 pointer-events-none">
                {res.description}
              </p>

              {/* Bottom Info Bar */}
              <div className="mt-6 flex w-full items-center justify-between border-t border-fd-border pt-3.5 text-xs pointer-events-none">
                <span className="font-medium text-fd-muted-foreground flex items-center gap-1">
                  <Paperclip className="size-3.5 text-brand-gold" />
                  {res.fileSize}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-fd-primary">
                  Download File
                  <Download
                    className="size-3.5 transition-transform group-hover:translate-y-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </FadeInSection>
    </main>
  );
}
