import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { auth } from '@/auth';
import { isAllowedAdmin } from '@/lib/admin';

export async function POST(req: Request) {
  const session = await auth();

  if (!isAllowedAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // If Cloudinary credentials or preset are configured, upload to Cloudinary API
    if (cloudName && (uploadPreset || (apiKey && apiSecret))) {
      const cloudFormData = new FormData();
      const blob = new Blob([buffer], { type: file.type });
      cloudFormData.append('file', blob, file.name);

      if (uploadPreset) {
        cloudFormData.append('upload_preset', uploadPreset);
      } else if (apiKey && apiSecret) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signatureStr = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

        cloudFormData.append('api_key', apiKey);
        cloudFormData.append('timestamp', timestamp);
        cloudFormData.append('signature', signature);
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudFormData,
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          success: true,
          url: data.secure_url || data.url,
          provider: 'cloudinary',
        });
      }
    }

    // Fallback: Save file locally under public/uploads/logos/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExt = path.extname(file.name) || '.png';
    const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${fileExt}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/logos/${safeName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      provider: 'local',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image file.' }, { status: 500 });
  }
}
