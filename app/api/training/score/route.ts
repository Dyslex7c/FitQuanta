import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TrainingAnalysis from '@/models/TrainingAnalysis';
import { verifyAuth } from '@/lib/auth';
import { STATUS_COLOR, STATUS_LABEL } from '@/types/training';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();

    const analysis = await TrainingAnalysis.findOne({ userId }).sort({ weekStartDate: -1 }).lean() as {
      trainingScore: number;
      recoveryScore: number;
      weeklyIntensityScore: number;
      trainingStatus: keyof typeof STATUS_COLOR;
    } | null;

    if (!analysis) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        colorHex: STATUS_COLOR[analysis.trainingStatus],
        statusLabel: STATUS_LABEL[analysis.trainingStatus],
      },
    });
  } catch (error: unknown) {
    console.error('[TRAINING SCORE GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
