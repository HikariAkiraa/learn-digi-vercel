import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  DocsBody,
  DocsPage,
} from 'fumadocs-ui/layouts/docs/page';
import { getMDXComponents } from '@/components/mdx';
import { DraftBadge, EditInCms } from '@/components/edit-in-cms';
import { TinaHeader } from '@/components/tina-wrapper';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

const DOCS_QUERY = `
query docs($relativePath: String!) {
  docs(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    title
    description
    draft
    course
    icon
    full
    body
  }
}
`;

import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { source, draftSource } from '@/lib/source';

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = isAllowedAdmin(session?.user?.email);

  const targetSource = isAdmin ? draftSource : source;
  const page = targetSource.getPage(slug);

  if (!page) {
    if (slug && slug.length === 1) {
      const folderSlug = slug[0];
      const childPages = targetSource.getPages().filter((p) => p.slugs[0] === folderSlug);
      if (childPages.length > 0) {
        redirect(childPages[0].url);
      }
    }
    notFound();
  }

  const MDX = page.data.body;
  const relativePath = page.path;

  const initialData = {
    docs: {
      title: page.data.title,
      description: page.data.description,
      draft: page.data.draft,
    },
  };

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: 'clerk' }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Suspense fallback={null}>
          <EditInCms path={page.path} />
        </Suspense>

        {page.data.draft && isAdmin ? <DraftBadge /> : null}
      </div>

      <TinaHeader
        query={DOCS_QUERY}
        variables={{ relativePath }}
        data={initialData}
        fallbackTitle={page.data.title}
        fallbackDescription={page.data.description}
      />

      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return draftSource.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = isAllowedAdmin(session?.user?.email);
  const targetSource = isAdmin ? draftSource : source;

  const page = targetSource.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
