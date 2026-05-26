import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ProgressLog from '@/models/ProgressLog';
import { verifyAuth, sanitizeObject } from '@/lib/auth';
import { progressLogSchema } from '@/schemas/progressLogSchema';

import { runAchievementEngine } from '@/lib/achievementEngine';
import { runTrainingAnalysisEngine } from '@/lib/trainingAnalysisEngine';


export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const parsed = progressLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid log data', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    // Strip any $ keys just in case
    const clean = sanitizeObject(parsed.data as Record<string, unknown>);
    await connectDB();
    const log = await ProgressLog.create({ ...clean, userId });
    
    /* Trigger achievements check asynchronously */
    void runAchievementEngine(userId);

    /* Trigger training analysis engine asynchronously */
    void runTrainingAnalysisEngine(userId);

    return NextResponse.json({ success: true, data: log.toObject() }, { status: 201 });
  } catch (error: unknown) {
    console.error('[LOG ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
