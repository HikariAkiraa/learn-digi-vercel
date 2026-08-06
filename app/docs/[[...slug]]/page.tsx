import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  DocsBody,
  DocsPage,
  DocsTitle,
  DocsDescription,
} from 'fumadocs-ui/layouts/docs/page';
import { getMDXComponents } from '@/components/mdx';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { source, draftSource } from '@/lib/source';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

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

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: 'clerk' }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description && <DocsDescription>{page.data.description}</DocsDescription>}

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
