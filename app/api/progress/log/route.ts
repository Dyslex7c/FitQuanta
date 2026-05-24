import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ProgressLog from '@/models/ProgressLog';
import { verifyAuth, handleApiError } from '@/lib/auth';
import { progressLogSchema } from '@/schemas/progressLogSchema';
import type { ApiResponse } from '@/types/api';
import type { IProgressLog } from '@/types/progress';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<IProgressLog>>> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const parsed = progressLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid log data' }, { status: 400 });
    }
    await connectDB();
    const log = await ProgressLog.create({ ...parsed.data, userId });
    return NextResponse.json({ success: true, data: log.toObject() as unknown as IProgressLog }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
