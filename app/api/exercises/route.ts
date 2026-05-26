import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import { exerciseQuerySchema } from '@/schemas/exerciseQuerySchema';
import type { ApiResponse } from '@/types/api';
import type { IExerciseListResponse } from '@/types/exercise';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<IExerciseListResponse>>> {
  try {
    const { searchParams } = new URL(req.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = exerciseQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params' }, { status: 400 });
    }

    const { search, muscleGroup, workoutType, difficulty, equipment, page, limit } = parsed.data;

    const filter: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      filter.$text = { $search: search.trim() };
    }
    if (muscleGroup)  filter.muscleGroup  = muscleGroup;
    if (workoutType)  filter.workoutType  = workoutType;
    if (difficulty)   filter.difficulty   = difficulty;
    if (equipment)    filter.equipment    = equipment;

    await connectDB();

    const skip = (page - 1) * limit;
    const [exercises, total] = await Promise.all([
      Exercise.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Exercise.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        exercises: exercises as unknown as IExerciseListResponse['exercises'],
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + exercises.length < total,
      },
    });
  } catch (error: unknown) {
    console.error('[EXERCISES LIST ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
