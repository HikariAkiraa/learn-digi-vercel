import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';

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

    const dirPath = path.join(process.cwd(), 'content', 'docs', cleanFolder);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, fileName);

    // Initial template for new module (NO repeated H1 title in body)
    const initialContent = `---
title: '${title.replace(/'/g, "\\'")}'
description: ''
draft: true
icon: ''
---

Write documentation content here...
`;

    fs.writeFileSync(filePath, initialContent, 'utf-8');

    // Update meta.json ordering
    const metaPath = path.join(dirPath, 'meta.json');
    let metaPages: string[] = [];

    if (fs.existsSync(metaPath)) {
      try {
        const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (Array.isArray(metaData.pages)) {
          metaPages = [...metaData.pages];
        }
      } catch (e) {
        console.error('Failed to parse meta.json:', e);
      }
    } else {
      // List existing files in folder if no meta.json
      const existing = fs.readdirSync(dirPath).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
      metaPages = existing.map((f) => path.basename(f, path.extname(f)));
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
      title: cleanFolder.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      pages: metaPages,
    };
    fs.writeFileSync(metaPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/docs', 'layout');
    } catch (e) {
      // Ignore if revalidatePath is unavailable
    }

    const redirectPath = cleanFolder ? `/docs/${cleanFolder}/${fileSlug}` : `/docs/${fileSlug}`;
    return NextResponse.json({ success: true, redirectUrl: redirectPath, slug: fileSlug });
  } catch (err) {
    console.error('Error creating module:', err);
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
  }
}
