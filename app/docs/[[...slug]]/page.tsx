import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { source } from '@/lib/source';
import { getMDXComponents } from '@/components/mdx';
import { DraftBadge, EditInCms } from '@/components/edit-in-cms';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  /**
   * `source` is the draft-filtered loader. A page with `draft: true` was
   * removed before the loader ever saw it, so `getPage` returns undefined and
   * this 404s — no separate draft check is required, and none can be forgotten.
   */
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: 'clerk' }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/*
          Suspense + `experimental.ppr` lets Next.js prerender the static shell
          of this page and stream only the session-dependent button. Without
          the boundary, reading cookies here would make the whole route dynamic.
        */}
        <Suspense fallback={null}>
          <EditInCms path={page.path} />
        </Suspense>

        {/* Only reachable on `next dev`, where lib/source.ts keeps drafts. */}
        {page.data.draft ? <DraftBadge /> : null}
      </div>

      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>

      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

/**
 * Only non-draft pages exist in `source`, so drafts are never prerendered and
 * never appear in the route manifest.
 */
export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
