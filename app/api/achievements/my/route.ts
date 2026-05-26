import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserAchievement from '@/models/UserAchievement';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    const unseenCount = await UserAchievement.countDocuments({ userId, seen: false });
    return NextResponse.json({ success: true, data: { unseenCount } });
  } catch (error: unknown) {
    console.error('[MY ACHIEVEMENTS ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}

/* Mark all as seen */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    await UserAchievement.updateMany({ userId, seen: false }, { $set: { seen: true } });
    return NextResponse.json({ success: true, data: { marked: true } });
  } catch (error: unknown) {
    console.error('[MARK SEEN ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
