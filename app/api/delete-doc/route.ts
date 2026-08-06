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
    const { docPath } = body;

    if (!docPath) {
      return NextResponse.json({ error: 'docPath is required' }, { status: 400 });
    }

    // Normalize path and prevent directory traversal
    const normalizedRelative = docPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalizedRelative.includes('..')) {
      return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
    }

    let relativeFilePath = normalizedRelative;
    if (!relativeFilePath.endsWith('.mdx') && !relativeFilePath.endsWith('.md')) {
      relativeFilePath += '.mdx';
    }

    const absolutePath = path.join(process.cwd(), 'content', 'docs', relativeFilePath);

    if (fs.existsSync(absolutePath)) {
      // Delete file from disk
      fs.unlinkSync(absolutePath);
    }

    // Also remove from meta.json if meta.json exists in directory
    const dirPath = path.dirname(absolutePath);
    const metaPath = path.join(dirPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const fileBase = path.basename(relativeFilePath, path.extname(relativeFilePath));
        const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (Array.isArray(metaContent.pages)) {
          metaContent.pages = metaContent.pages.filter((p: string) => p !== fileBase);
          fs.writeFileSync(metaPath, JSON.stringify(metaContent, null, 2), 'utf-8');
        }
      } catch (e) {
        console.error('Failed to update meta.json on deletion:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ error: 'Failed to delete document file' }, { status: 500 });
  }
}
