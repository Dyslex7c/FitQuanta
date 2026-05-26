import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';
import { verifyAuth, handleApiError } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['trainer', 'admin']);
    await connectDB();

    const trainer = await Trainer.findOne({ userId }).lean();
    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: trainer });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['trainer']);
    const body = await req.json();
    await connectDB();

    const trainer = await Trainer.findOne({ userId });
    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });
    }

    // List of editable fields
    const editableFields = [
      'age', 'gender', 'country', 'location', 'bio',
      'certifications', 'yearsOfExperience', 'specializations',
      'profilePhotoUrl', 'availabilityStatus'
    ];

    editableFields.forEach(field => {
      if (body[field] !== undefined) {
        (trainer as any)[field] = body[field];
      }
    });

    await trainer.save();

    return NextResponse.json({ success: true, data: trainer.toObject() });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
