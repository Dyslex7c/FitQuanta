import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    await connectDB();
    const exercises = await Exercise.find({ workoutType: type as any })
      .sort({ difficulty: 1 })
      .limit(20)
      .lean();
    return NextResponse.json({ success: true, data: exercises });
  } catch (error: unknown) {
    console.error('[EXERCISE TYPE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
