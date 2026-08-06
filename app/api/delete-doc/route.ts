import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { deleteFileFromGitHub, saveFileContent } from '@/lib/github-sync';

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

    const repoDocPath = `content/docs/${relativeFilePath}`;

    await deleteFileFromGitHub({
      filePath: repoDocPath,
      commitMessage: `Delete module: ${relativeFilePath}`,
    });

    // Also remove from meta.json if meta.json exists in directory
    const dirRelative = path.dirname(relativeFilePath).replace(/\\/g, '/');
    const relativeMetaPath = `content/docs/${dirRelative === '.' ? '' : dirRelative + '/'}meta.json`;
    const absoluteMetaPath = path.join(process.cwd(), relativeMetaPath);

    if (fs.existsSync(absoluteMetaPath)) {
      try {
        const fileBase = path.basename(relativeFilePath, path.extname(relativeFilePath));
        const metaContent = JSON.parse(fs.readFileSync(absoluteMetaPath, 'utf-8'));
        if (Array.isArray(metaContent.pages)) {
          metaContent.pages = metaContent.pages.filter((p: string) => p !== fileBase);
          await saveFileContent({
            filePath: relativeMetaPath,
            content: JSON.stringify(metaContent, null, 2),
            commitMessage: `Remove ${fileBase} from meta.json`,
          });
        }
      } catch (e) {
        console.error('Failed to update meta.json on deletion:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete document file' }, { status: 500 });
  }
}
