import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';

export async function POST(req: Request) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await req.json();

    if (!slug || typeof slug !== 'string' || slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
      return NextResponse.json({ error: 'Invalid course slug' }, { status: 400 });
    }

    const targetDir = path.join(process.cwd(), 'content', 'docs', slug);

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // Clean up parent meta.json
    const parentMetaPath = path.join(process.cwd(), 'content', 'docs', 'meta.json');
    if (fs.existsSync(parentMetaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(parentMetaPath, 'utf-8'));
        if (Array.isArray(meta.pages)) {
          meta.pages = meta.pages.filter((p: string) => p !== slug);
          fs.writeFileSync(parentMetaPath, JSON.stringify(meta, null, 2), 'utf-8');
        }
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: `Course '${slug}' deleted successfully.` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course folder' }, { status: 500 });
  }
}
