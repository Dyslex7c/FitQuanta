import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import UserAchievement from '@/models/UserAchievement';
import ProgressLog from '@/models/ProgressLog';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();

    const [allAchievements, earned, logs] = await Promise.all([
      Achievement.find({}).sort({ sortOrder: 1 }).lean(),
      UserAchievement.find({ userId }).lean(),
      ProgressLog.find({ userId }).lean(),
    ]);

    const earnedMap = new Map<string, string>(
      earned.map(e => [e.achievementId.toString(), e.unlockedAt.toISOString()])
    );

    /* Compute progress values for locked badges */
    const workoutLogs   = logs.filter(l => l.type === 'workout');
    const nutritionLogs = logs.filter(l => l.type === 'nutrition');
    const healthLogs    = logs.filter(l => l.type === 'health');

    const statsMap: Record<string, number> = {
      workout_count:    workoutLogs.length,
      nutrition_count:  nutritionLogs.length,
      health_count:     healthLogs.length,
      sleep_days_8plus: healthLogs.filter(l => (l.sleepHours ?? 0) >= 8).length,
      step_days_10k:    healthLogs.filter(l => (l.steps ?? 0) >= 10000).length,
      cardio_sessions:  healthLogs.filter(l => l.cardio && l.cardio.length > 0).length,
      protein_days_100: nutritionLogs.filter(l => (l.protein ?? 0) >= 100).length,
    };

    const withProgress = allAchievements.map(a => {
      const isEarned = earnedMap.has(a._id.toString());
      const current  = statsMap[a.condition.type] ?? 0;
      const progress = Math.min(Math.round((current / a.condition.threshold) * 100), 100);

      return {
        ...a,
        earned:       isEarned,
        unlockedAt:   isEarned ? earnedMap.get(a._id.toString()) : undefined,
        currentValue: current,
        progress:     isEarned ? 100 : progress,
      };
    });

    return NextResponse.json({ success: true, data: withProgress });
  } catch (error: unknown) {
    console.error('[ACHIEVEMENTS GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
