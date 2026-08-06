import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { saveFileContent } from '@/lib/github-sync';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { folderPath, title, targetSlug, position, insertIndex } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const cleanFolder = (folderPath || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const fileSlug = slugify(title) || 'new-module';
    const fileName = `${fileSlug}.mdx`;

    const repoDocPath = `content/docs/${cleanFolder ? cleanFolder + '/' : ''}${fileName}`;

    // Initial template for new module
    const initialContent = `---
title: '${title.replace(/'/g, "\\'")}'
description: ''
draft: true
icon: ''
---

Write documentation content here...
`;

    await saveFileContent({
      filePath: repoDocPath,
      content: initialContent,
      commitMessage: `Create module: ${title}`,
    });

    // Update meta.json ordering
    const cleanDir = cleanFolder ? `content/docs/${cleanFolder}` : 'content/docs';
    const relativeMetaPath = `${cleanDir}/meta.json`;
    const metaPath = path.join(process.cwd(), relativeMetaPath);
    let metaPages: string[] = [];
    let existingMetaObj: Record<string, any> = {};

    if (fs.existsSync(metaPath)) {
      try {
        existingMetaObj = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (Array.isArray(existingMetaObj.pages)) {
          metaPages = [...existingMetaObj.pages];
        }
      } catch (e) {
        console.error('Failed to parse meta.json:', e);
      }
    }

    // Filter out if slug already in pages
    metaPages = metaPages.filter((p) => p !== fileSlug);

    // Calculate exact target position
    let insertIdx = metaPages.length;
    if (targetSlug) {
      const foundIdx = metaPages.indexOf(targetSlug);
      if (foundIdx !== -1) {
        insertIdx = position === 'after' ? foundIdx + 1 : foundIdx;
      }
    } else if (typeof insertIndex === 'number' && insertIndex >= 0) {
      insertIdx = Math.min(insertIndex, metaPages.length);
    }

    metaPages.splice(insertIdx, 0, fileSlug);

    // Write updated meta.json
    const updatedMeta = {
      ...existingMetaObj,
      title: existingMetaObj.title || cleanFolder.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      pages: metaPages,
    };

    await saveFileContent({
      filePath: relativeMetaPath,
      content: JSON.stringify(updatedMeta, null, 2),
      commitMessage: `Update meta.json page order for ${fileSlug}`,
    });

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/docs', 'layout');
    } catch (e) {}

    const pageUrl = cleanFolder ? `/docs/${cleanFolder}/${fileSlug}` : `/docs/${fileSlug}`;

    return NextResponse.json({
      success: true,
      message: 'Module created successfully',
      fileSlug,
      url: pageUrl,
    });
  } catch (err: any) {
    console.error('Error creating module:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create module' }, { status: 500 });
  }
}
