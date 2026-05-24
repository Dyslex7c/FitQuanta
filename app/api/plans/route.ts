import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    const plan = await Plan.findOne({ userId, type: 'ai_free' }).sort({ createdAt: -1 }).lean();
    if (!plan) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({ success: true, data: plan });
  } catch (error: unknown) {
    console.error('[PLAN FETCH ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
