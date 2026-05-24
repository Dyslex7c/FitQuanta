import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { verifyAuth, handleApiError } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { IPlan } from '@/types/plan';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<IPlan>>> {
  try {
    const { userId } = verifyAuth(req, ['client', 'trainer', 'admin']);
    await connectDB();
    const plan = await Plan.findOne({ userId }).sort({ createdAt: -1 });
    if (!plan) {
      return NextResponse.json({ success: false, message: 'No plan found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: plan.toObject() as unknown as IPlan });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
