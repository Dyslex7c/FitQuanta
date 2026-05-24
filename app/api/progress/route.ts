import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ProgressLog from '@/models/ProgressLog';
import { verifyAuth, handleApiError } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { IProgressLog } from '@/types/progress';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<IProgressLog[]>>> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    const logs = await ProgressLog.find({ userId })
      .sort({ date: -1 })
      .limit(200)
      .lean<IProgressLog[]>();
    
    // Safely cast and map lean documents to match IProgressLog properties
    const safeLogs = logs.map((log: any) => ({
      ...log,
      _id: log._id.toString(),
      userId: log.userId.toString(),
      date: log.date instanceof Date ? log.date.toISOString() : log.date,
    })) as unknown as IProgressLog[];

    return NextResponse.json({ success: true, data: safeLogs });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
