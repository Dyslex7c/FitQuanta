import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TrainingAnalysis from '@/models/TrainingAnalysis';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();

    const latest = await TrainingAnalysis.findOne({ userId }).sort({ weekStartDate: -1 }).lean();

    const history = await TrainingAnalysis.find({ userId })
      .sort({ weekStartDate: -1 })
      .limit(8)
      .select('weekStartDate trainingScore recoveryScore fatigueLevel trainingStatus weeklyVolume weeklyFrequency')
      .lean();

    return NextResponse.json({ success: true, data: { latest, history } });
  } catch (error: unknown) {
    console.error('[TRAINING ANALYSIS GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
