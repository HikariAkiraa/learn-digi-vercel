import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { saveFileContent } from '@/lib/github-sync';

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

    const repoFilePath = `content/docs/${relativeFilePath}`;

    await saveFileContent({
      filePath: repoFilePath,
      content,
      commitMessage: `Update module documentation: ${relativeFilePath}`,
    });

    return NextResponse.json({ success: true, message: 'Document saved successfully' });
  } catch (err: any) {
    console.error('Error saving document:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save document file' }, { status: 500 });
  }
}
