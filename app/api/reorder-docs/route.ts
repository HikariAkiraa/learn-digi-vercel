import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';

export async function POST(request: Request) {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { folderPath, pageOrder, draggedSlug, targetSlug } = body;

    const cleanFolder = (folderPath || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const dirPath = path.join(process.cwd(), 'content', 'docs', cleanFolder);

    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ error: 'Folder path does not exist' }, { status: 444 });
    }

    const metaPath = path.join(dirPath, 'meta.json');
    let existingMeta: Record<string, any> = {};
    let pages: string[] = [];

    if (fs.existsSync(metaPath)) {
      try {
        existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (Array.isArray(existingMeta.pages)) {
          pages = [...existingMeta.pages];
        }
      } catch (e) {
        console.error('Failed to parse existing meta.json:', e);
      }
    }

    // If meta.json had no pages array, list files in directory
    if (pages.length === 0) {
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
      pages = files.map((f) => path.basename(f, path.extname(f)));
    }

    let finalPages: string[] = [];

    if (Array.isArray(pageOrder)) {
      finalPages = pageOrder;
    } else if (draggedSlug && targetSlug) {
      const sourceIdx = pages.indexOf(draggedSlug);
      const targetIdx = pages.indexOf(targetSlug);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const newPages = [...pages];
        const [draggedItem] = newPages.splice(sourceIdx, 1);
        const newTargetIdx = newPages.indexOf(targetSlug);

        // If dragging down (sourceIdx < targetIdx), place after target. If dragging up, place before target.
        const insertIdx = sourceIdx < targetIdx ? newTargetIdx + 1 : newTargetIdx;
        newPages.splice(insertIdx, 0, draggedItem);
        finalPages = newPages;
      } else {
        finalPages = pages;
      }
    } else {
      return NextResponse.json({ error: 'pageOrder or draggedSlug/targetSlug are required' }, { status: 400 });
    }

    const updatedMeta = {
      ...existingMeta,
      title: existingMeta.title || cleanFolder.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      pages: finalPages,
    };

    fs.writeFileSync(metaPath, JSON.stringify(updatedMeta, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Module order updated successfully', pages: finalPages });
  } catch (err) {
    console.error('Error reordering docs:', err);
    return NextResponse.json({ error: 'Failed to reorder docs' }, { status: 500 });
  }
}
