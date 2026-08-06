import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { getResources, saveResourcesAsync } from '@/lib/resources';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }

    const currentResources = getResources();
    const updatedList = currentResources
      .filter((res) => res.id !== id)
      .map((res) => ({
        id: res.id,
        title: res.title,
        description: res.description,
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileSize: res.fileSize,
        category: res.category,
        accent: res.accent,
        icon: res.iconName,
        createdAt: res.createdAt,
      }));

    await saveResourcesAsync(updatedList);

    try {
      revalidatePath('/resources');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource.' }, { status: 500 });
  }
}
