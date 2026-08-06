import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';
import { getResources, saveResourcesAsync, RawResourceData } from '@/lib/resources';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const { id, title, description, fileUrl, fileName, fileSize, category, accent, icon } = await req.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Resource title is required.' }, { status: 400 });
    }

    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
      return NextResponse.json({ error: 'Attachment file URL or uploaded file is required.' }, { status: 400 });
    }

    const currentResources = getResources();

    let updatedList: RawResourceData[] = [];

    if (id) {
      // EDIT MODE
      updatedList = currentResources.map((res) => {
        if (res.id === id) {
          return {
            ...res,
            title: title.trim(),
            description: (description || '').trim(),
            fileUrl: fileUrl.trim(),
            fileName: (fileName || res.fileName || '').trim(),
            fileSize: (fileSize || res.fileSize || 'Attachment').trim(),
            category: (category || 'Resource').trim(),
            accent: accent || 'bg-cyan-400',
            icon: icon || 'FileDown',
          };
        }
        return {
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
        };
      });
    } else {
      // CREATE MODE
      const newId = `res-${Date.now()}`;
      const newResource: RawResourceData = {
        id: newId,
        title: title.trim(),
        description: (description || '').trim(),
        fileUrl: fileUrl.trim(),
        fileName: (fileName || '').trim(),
        fileSize: (fileSize || 'Attachment').trim(),
        category: (category || 'Resource').trim(),
        accent: accent || 'bg-cyan-400',
        icon: icon || 'FileDown',
        createdAt: new Date().toISOString(),
      };

      updatedList = [
        newResource,
        ...currentResources.map((res) => ({
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
        })),
      ];
    }

    await saveResourcesAsync(updatedList);

    try {
      revalidatePath('/resources');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: id ? 'Resource updated successfully.' : 'Resource created successfully.',
    });
  } catch (error) {
    console.error('Error saving resource:', error);
    return NextResponse.json({ error: 'Failed to save resource.' }, { status: 500 });
  }
}
