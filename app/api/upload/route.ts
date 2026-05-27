import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verifyAuth, handleApiError } from '@/lib/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    verifyAuth(req, ['client', 'trainer', 'admin']);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    // 2. Validate file type (only allow images and pdfs/documents)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Only JPEG, PNG, GIF, WEBP and PDF are supported.' }, { status: 400 });
    }

    // 3. Make sure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // 4. Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        name: file.name,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
