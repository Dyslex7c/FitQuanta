import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ProgressLog from '@/models/ProgressLog';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    const logs = await ProgressLog.find({ userId })
      .sort({ date: -1 })
      .limit(365)
      .lean();
    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    console.error('[PROGRESS FETCH ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
