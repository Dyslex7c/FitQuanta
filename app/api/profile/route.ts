import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, handleApiError, sanitizeObject } from '@/lib/auth';
import { profileSchema } from '@/schemas/profileSchema';
import { runAchievementEngine } from '@/lib/achievementEngine';
import type { ApiResponse } from '@/types/api';
import type { IUserProfile } from '@/types/user';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<IUserProfile>>> {
  try {
    const { userId } = verifyAuth(req, ['client', 'trainer', 'admin']);
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user.toObject() as unknown as IUserProfile });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse<IUserProfile>>> {
  try {
    const { userId } = verifyAuth(req, ['client', 'trainer', 'admin']);
    const rawBody = await req.json();
    const cleanBody = sanitizeObject(rawBody);
    const parsed = profileSchema.safeParse(cleanBody);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid profile data' }, { status: 400 });
    }
    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: parsed.data },
      { new: true, runValidators: true }
    );
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    /* Trigger achievements check asynchronously */
    void runAchievementEngine(userId);

    return NextResponse.json({ success: true, data: user.toObject() as unknown as IUserProfile });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
