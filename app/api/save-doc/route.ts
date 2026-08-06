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
    const { docPath, content } = body;

    if (!docPath || typeof content !== 'string') {
      return NextResponse.json({ error: 'docPath and content are required' }, { status: 400 });
    }

    // Normalize path and prevent directory traversal
    const normalizedRelative = docPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalizedRelative.includes('..')) {
      return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
    }

    // Add .mdx extension if missing
    let relativeFilePath = normalizedRelative;
    if (!relativeFilePath.endsWith('.mdx') && !relativeFilePath.endsWith('.md')) {
      relativeFilePath += '.mdx';
    }

    const absolutePath = path.join(process.cwd(), 'content', 'docs', relativeFilePath);

    // Ensure parent directory exists
    const dirPath = path.dirname(absolutePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file directly to disk
    fs.writeFileSync(absolutePath, content, 'utf-8');

    return NextResponse.json({ success: true, message: 'Document saved successfully' });
  } catch (err) {
    console.error('Error saving document:', err);
    return NextResponse.json({ error: 'Failed to save document file' }, { status: 500 });
  }
}
