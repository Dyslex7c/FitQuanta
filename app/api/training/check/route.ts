import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { runTrainingAnalysisEngine } from '@/lib/trainingAnalysisEngine';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await runTrainingAnalysisEngine(userId);
    return NextResponse.json({ success: true, message: 'Analysis engine triggered.' });
  } catch (error: unknown) {
    console.error('[TRAINING CHECK ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
