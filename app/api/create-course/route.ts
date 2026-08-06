import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { saveFileContent } from '@/lib/github-sync';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: Request) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { editSlug, title, description, icon, image, level, accent } = body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Course title is required.' }, { status: 400 });
    }

    // MODE EDIT
    if (editSlug && typeof editSlug === 'string') {
      const relativeMetaPath = `content/docs/${editSlug}/meta.json`;
      const metaPath = path.join(process.cwd(), relativeMetaPath);
      let existingMeta: Record<string, any> = {};

      if (fs.existsSync(metaPath)) {
        try {
          existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        } catch (e) {}
      }

      const updatedMeta = {
        ...existingMeta,
        title: title.trim(),
        description: (description || '').trim(),
        icon: icon || existingMeta.icon || 'BookOpen',
        image: (image || '').trim(),
        level: level || existingMeta.level || 'Basic',
        accent: accent || existingMeta.accent || 'bg-brand-cyan',
        pages: existingMeta.pages || ['index', '...'],
      };

      await saveFileContent({
        filePath: relativeMetaPath,
        content: JSON.stringify(updatedMeta, null, 2),
        commitMessage: `Update course meta: ${title.trim()}`,
      });

      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/courses');
        revalidatePath('/docs', 'layout');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        slug: editSlug,
        url: `/docs/${editSlug}`,
        message: `Course '${title}' updated successfully.`,
      });
    }

    // MODE CREATE NEW
    const slug = slugify(title);
    if (!slug) {
      return NextResponse.json({ error: 'Invalid title format.' }, { status: 400 });
    }

    const relativeMetaPath = `content/docs/${slug}/meta.json`;
    const metaData = {
      title: title.trim(),
      description: (description || '').trim(),
      icon: icon || 'BookOpen',
      image: (image || '').trim(),
      level: level || 'Basic',
      accent: accent || 'bg-brand-cyan',
      pages: ['index', '...'],
    };

    await saveFileContent({
      filePath: relativeMetaPath,
      content: JSON.stringify(metaData, null, 2),
      commitMessage: `Create course: ${title.trim()}`,
    });

    const relativeIndexPath = `content/docs/${slug}/index.mdx`;
    const indexContent = `---
title: 'Overview'
description: '${(description || '').trim().replace(/'/g, "\\'")}'
draft: false
---

Write documentation content here...
`;

    await saveFileContent({
      filePath: relativeIndexPath,
      content: indexContent,
      commitMessage: `Create index overview for course: ${title.trim()}`,
    });

    const parentMetaPath = path.join(process.cwd(), 'content', 'docs', 'meta.json');
    if (fs.existsSync(parentMetaPath)) {
      try {
        const parentMeta = JSON.parse(fs.readFileSync(parentMetaPath, 'utf-8'));
        if (Array.isArray(parentMeta.pages)) {
          if (!parentMeta.pages.includes(slug)) {
            const wildcardIndex = parentMeta.pages.indexOf('...');
            if (wildcardIndex !== -1) {
              parentMeta.pages.splice(wildcardIndex, 0, slug);
            } else {
              parentMeta.pages.push(slug);
            }
            await saveFileContent({
              filePath: 'content/docs/meta.json',
              content: JSON.stringify(parentMeta, null, 2),
              commitMessage: `Add ${slug} to top-level meta.json`,
            });
          }
        }
      } catch (e) {}
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/courses');
      revalidatePath('/docs', 'layout');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      slug,
      url: `/docs/${slug}`,
      message: `Course '${title}' successfully created.`,
    });
  } catch (error: any) {
    console.error('Failed to save course error:', error);
    return NextResponse.json(
      { error: error?.message || String(error) || 'Failed to save course.' },
      { status: 500 }
    );
  }
}
