import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import { runAchievementEngine } from '@/lib/achievementEngine';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    await runAchievementEngine(userId);
    return NextResponse.json({ success: true, message: 'Achievement check triggered successfully' });
  } catch (error: unknown) {
    console.error('[MANUAL CHECK ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
