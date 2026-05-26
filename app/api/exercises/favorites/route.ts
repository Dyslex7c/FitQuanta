import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import { verifyAuth, handleApiError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();
    const user = await User.findById(userId).select('favoriteExercises').lean() as { favoriteExercises?: string[] } | null;
    const ids = user?.favoriteExercises ?? [];
    const exercises = await Exercise.find({ _id: { $in: ids } }).lean();
    return NextResponse.json({ success: true, data: exercises });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const exerciseId = String(body?.exerciseId ?? '').trim();
    if (!exerciseId) return NextResponse.json({ success: false, message: 'exerciseId required' }, { status: 400 });

    await connectDB();
    const user = await User.findById(userId).select('favoriteExercises') as { favoriteExercises?: string[]; save: () => Promise<void> } | null;
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const favs = user.favoriteExercises ?? [];
    const alreadySaved = favs.includes(exerciseId);

    await User.findByIdAndUpdate(
      userId,
      alreadySaved
        ? { $pull: { favoriteExercises: exerciseId } }
        : { $addToSet: { favoriteExercises: exerciseId } }
    );

    return NextResponse.json({ success: true, data: { saved: !alreadySaved } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
