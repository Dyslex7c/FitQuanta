import { connectDB } from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import UserAchievement from '@/models/UserAchievement';
import UserReward from '@/models/UserReward';
import Notification from '@/models/Notification';
import ProgressLog from '@/models/ProgressLog';
import User from '@/models/User';
import mongoose from 'mongoose';

/* ── Reward tiers definition ─────────────────────── */
export const REWARD_TIERS = [
  {
    label:           'Rising Star',
    badgesRequired:  3,
    rewardDescription: '5% off any trainer plan',
    discountPercent: 5,
    perks:           ['Profile highlight badge', '5% trainer plan discount'],
    colorHex:        '#b8c4d4',
  },
  {
    label:           'Dedicated Athlete',
    badgesRequired:  5,
    rewardDescription: '10% off any trainer plan',
    discountPercent: 10,
    perks:           ['Silver profile border', '10% trainer plan discount', 'Priority chat support'],
    colorHex:        '#f07028',
  },
  {
    label:           'Elite Member',
    badgesRequired:  10,
    rewardDescription: '20% off any trainer plan',
    discountPercent: 20,
    perks:           ['Gold profile border', '20% trainer plan discount', 'Free trainer consultation (30 min)', 'Featured on marketplace'],
    colorHex:        '#e8a820',
  },
  {
    label:           'Legend',
    badgesRequired:  15,
    rewardDescription: 'Premium perks unlocked',
    discountPercent: 25,
    perks:           ['Diamond profile border', '25% trainer plan discount', 'Monthly free trainer session', 'Priority plan generation', 'Legend badge on profile'],
    colorHex:        '#9060f0',
  },
];

/* ── Generate a simple discount code ────────────── */
function generateCode(prefix: string, percent: number): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FQ${prefix}${percent}-${rand}`;
}

/* ── Calculate consecutive day streak ───────────── */
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map(d => d.toISOString().slice(0, 10)))].sort().reverse();
  let streak = 1;
  for (let i = 0; i < unique.length - 1; i++) {
    const curr = new Date(unique[i]!);
    const next = new Date(unique[i + 1]!);
    const diff = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  /* Only count streak if today or yesterday is included */
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  return streak;
}

/* ── Main engine function ────────────────────────── */
export async function runAchievementEngine(userId: string): Promise<void> {
  try {
    await connectDB();

    /* 1. Fetch all achievement definitions */
    const allAchievements = await Achievement.find({}).lean();

    /* 2. Fetch already-earned achievement IDs */
    const earned = await UserAchievement.find({ userId }).select('achievementId').lean();
    const earnedIds = new Set(earned.map(e => e.achievementId.toString()));

    /* 3. Fetch all user progress logs */
    const logs = await ProgressLog.find({ userId }).lean();

    /* 4. Fetch user profile */
    const user = await User.findById(userId).select('weight bmi').lean() as { weight?: number; bmi?: number } | null;

    /* 5. Pre-compute stats needed by conditions */
    const workoutLogs    = logs.filter(l => l.type === 'workout');
    const nutritionLogs  = logs.filter(l => l.type === 'nutrition');
    const healthLogs     = logs.filter(l => l.type === 'health');

    const workoutDates   = workoutLogs.map(l => new Date(l.date));
    const nutritionDates = nutritionLogs.map(l => new Date(l.date));
    const sleepDates     = healthLogs.filter(l => (l.sleepHours ?? 0) >= 8).map(l => new Date(l.date));
    const stepDates      = healthLogs.filter(l => (l.steps ?? 0) >= 10000).map(l => new Date(l.date));

    const workoutStreak    = calculateStreak(workoutDates);
    const nutritionStreak  = calculateStreak(nutritionDates);

    const cardioDays = healthLogs.filter(l => l.cardio && l.cardio.length > 0).length;

    const bodyWeights = logs
      .filter(l => l.bodyWeight != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(l => l.bodyWeight as number);

    const firstWeight  = bodyWeights[0] ?? 0;
    const latestWeight = bodyWeights[bodyWeights.length - 1] ?? 0;
    const weightLostKg = firstWeight > latestWeight ? firstWeight - latestWeight : 0;

    /* Volume increase — compare first 5 workouts avg volume to last 5 */
    const volumePerSession = workoutLogs.map(l =>
      (l.exercises ?? []).reduce((sum: number, e: { sets: number; reps: number; weight: number }) =>
        sum + (e.sets ?? 0) * (e.reps ?? 0) * (e.weight ?? 0), 0)
    );
    const firstFiveAvg = volumePerSession.length > 0 
      ? volumePerSession.slice(0, 5).reduce((s, v) => s + v, 0) / Math.min(volumePerSession.length, 5)
      : 0;
    const lastFiveAvg  = volumePerSession.length > 0
      ? volumePerSession.slice(-5).reduce((s, v) => s + v, 0) / Math.min(volumePerSession.length, 5)
      : 0;
    const strengthGained = firstFiveAvg > 0 && lastFiveAvg > firstFiveAvg * 1.2; /* 20% improvement */

    /* Protein goal — days where protein >= 100g */
    const proteinDays = nutritionLogs.filter(l => (l.protein ?? 0) >= 100).length;

    const statsMap: Record<string, number> = {
      workout_count:    workoutLogs.length,
      nutrition_count:  nutritionLogs.length,
      health_count:     healthLogs.length,
      workout_streak:   workoutStreak,
      nutrition_streak: nutritionStreak,
      sleep_days_8plus: sleepDates.length,
      step_days_10k:    stepDates.length,
      cardio_sessions:  cardioDays,
      weight_lost_kg:   weightLostKg,
      protein_days_100: proteinDays,
      profile_complete: 1,  /* will check separately */
      strength_gained:  strengthGained ? 1 : 0,
    };

    /* 6. Check each achievement */
    const newlyUnlocked: typeof allAchievements = [];

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement._id.toString())) continue;

      const { type, threshold } = achievement.condition;
      const currentValue = statsMap[type] ?? 0;

      if (currentValue >= threshold) {
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length === 0) return;

    /* 7. Insert newly unlocked achievements (ignore duplicates) */
    const docs = newlyUnlocked.map(a => ({
      userId:        new mongoose.Types.ObjectId(userId),
      achievementId: a._id,
      unlockedAt:    new Date(),
      seen:          false,
    }));

    await UserAchievement.insertMany(docs, { ordered: false }).catch(() => {
      /* Ignore duplicate key errors — race condition protection */
    });

    /* 8. Update reward record */
    const totalEarned = earnedIds.size + newlyUnlocked.length;

    let reward = await UserReward.findOne({ userId });
    if (!reward) {
      reward = await UserReward.create({ userId, totalBadgesEarned: 0, currentTierIndex: -1 });
    }

    reward.totalBadgesEarned = totalEarned;

    /* Check if user crossed a new reward tier */
    let newTierIndex = -1;
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
      if (totalEarned >= REWARD_TIERS[i]!.badgesRequired) {
        newTierIndex = i;
        break;
      }
    }

    if (newTierIndex > reward.currentTierIndex) {
      /* Crossed into a new tier — generate discount code */
      const tier = REWARD_TIERS[newTierIndex]!;
      const code = generateCode(tier.label.replace(/\s/g, '').toUpperCase().slice(0, 4), tier.discountPercent);
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); /* 90 days */

      reward.discountCodes.push({ code, discountPercent: tier.discountPercent, used: false, expiresAt });
      reward.currentTierIndex = newTierIndex;

      /* Notify tier upgrade */
      await Notification.create({
        userId,
        type:    'system',
        title:   `🎉 ${tier.label} Tier Unlocked!`,
        message: `You've reached ${tier.label}! Your reward: ${tier.rewardDescription}. Code: ${code}`,
        link:    '/badges',
      });
    }

    await reward.save();

    /* 9. Create notifications for each new badge */
    await Notification.insertMany(
      newlyUnlocked.map(a => ({
        userId,
        type:    'system',
        title:   `${a.icon} Badge Unlocked: ${a.name}`,
        message: a.description,
        link:    '/badges',
      }))
    );

  } catch (error: unknown) {
    /* Engine errors must NEVER crash the parent request */
    console.error('[ACHIEVEMENT ENGINE ERROR]', error);
  }
}
