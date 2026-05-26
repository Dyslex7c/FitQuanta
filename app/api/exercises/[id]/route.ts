import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import type { ApiResponse } from '@/types/api';
import type { IExercise } from '@/types/exercise';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<IExercise>>> {
  try {
    const { id } = await params;
    await connectDB();

    // Support lookup by either MongoDB _id or slug
    const exercise = await Exercise.findOne({
      $or: [
        ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : []),
        { slug: id },
      ],
    }).lean();

    if (!exercise) {
      return NextResponse.json({ success: false, message: 'Exercise not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: exercise as unknown as IExercise });
  } catch (error: unknown) {
    console.error('[EXERCISE DETAIL ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
