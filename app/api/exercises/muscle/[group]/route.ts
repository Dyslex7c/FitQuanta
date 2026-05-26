import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ group: string }> }
) {
  try {
    const { group } = await params;
    await connectDB();
    const exercises = await Exercise.find({ muscleGroup: group as any })
      .sort({ difficulty: 1 })
      .limit(20)
      .lean();
    return NextResponse.json({ success: true, data: exercises });
  } catch (error: unknown) {
    console.error('[EXERCISE MUSCLE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
