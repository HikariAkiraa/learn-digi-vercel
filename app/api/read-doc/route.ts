import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';

export async function GET(request: Request) {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const docPath = searchParams.get('path');

  if (!docPath) {
    return NextResponse.json({ error: 'Document path is required' }, { status: 400 });
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

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return NextResponse.json({ success: true, content, path: relativeFilePath });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read document file' }, { status: 500 });
  }
}
