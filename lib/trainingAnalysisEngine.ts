import { connectDB } from '@/lib/mongodb';
import ProgressLog from '@/models/ProgressLog';
import TrainingAnalysis from '@/models/TrainingAnalysis';
import mongoose from 'mongoose';

/* ── Thresholds ──────────────────────────────────── */
const THRESHOLDS = {
  weeklyVolume:        { under: 40, optimal: [40, 150], over: 150 },
  weeklyFrequency:     { under: 2,  optimal: [3, 5],    over: 6  },
  consecutiveDays:     { overLimit: 5 },
  sleepHours:          { poor: 6,   good: 7.5 },
  calories:            { low: 1600, high: 3500 },
  cardioMinutes:       { over: 300 },
  setsPerMuscle:       { over: 20 },
  recoveryHours:       { minimum: 48 },
};

const MUSCLE_KEYWORD_MAP: Record<string, string[]> = {
  chest:     ['bench', 'chest', 'pec', 'fly', 'push'],
  back:      ['row', 'pull', 'lat', 'deadlift', 'back'],
  shoulders: ['shoulder', 'press', 'lateral', 'delt', 'ohp'],
  biceps:    ['bicep', 'curl'],
  triceps:   ['tricep', 'dip', 'pushdown', 'extension'],
  legs:      ['squat', 'leg', 'lunge', 'quad', 'hamstring', 'calf'],
  glutes:    ['glute', 'hip thrust', 'rdl'],
  core:      ['core', 'ab', 'plank', 'crunch', 'oblique'],
  cardio:    ['run', 'cycle', 'swim', 'cardio', 'hiit', 'treadmill', 'elliptical'],
};

/* ── Helpers ─────────────────────────────────────── */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function scoreInRange(value: number, low: number, high: number): number {
  if (value < low)  return Math.round((value / low) * 60);
  if (value > high) return Math.max(0, 100 - Math.round(((value - high) / high) * 50));
  return 100;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function detectMuscle(exerciseName: string): string {
  const lower = exerciseName.toLowerCase();
  for (const [muscle, keywords] of Object.entries(MUSCLE_KEYWORD_MAP)) {
    if (keywords.some(k => lower.includes(k))) return muscle;
  }
  return 'core';
}

function buildAiInsights(
  status: string,
  recoveryScore: number,
  consecutiveDays: number,
  sleepAvg: number,
  muscleRecovery: Array<{ muscle: string; needsRest: boolean }>,
  weeklyFrequency: number,
): string[] {
  const insights: string[] = [];

  if (status === 'optimal') {
    insights.push('Your recovery and training balance is excellent this week.');
    insights.push('Keep maintaining this level of consistency for long-term progression.');
  }

  if (status === 'overtraining') {
    insights.push('Your training load is critically high — schedule at least one full rest day immediately.');
    if (consecutiveDays >= 5) insights.push(`You have trained ${consecutiveDays} consecutive days. Muscle breakdown risk is elevated.`);
    if (sleepAvg < THRESHOLDS.sleepHours.poor) insights.push('Poor sleep combined with high training intensity is increasing your injury risk.');
  }

  if (status === 'undertraining') {
    insights.push('Training intensity appears lower than recommended for meaningful progress.');
    if (weeklyFrequency < THRESHOLDS.weeklyFrequency.under) insights.push('Aim for at least 3 workout sessions per week to stimulate muscle adaptation.');
  }

  if (status === 'slight_undertraining') {
    insights.push('Your training volume is slightly below optimal. Consider adding one more session this week.');
  }

  const tiredMuscles = muscleRecovery.filter(m => m.needsRest).map(m => m.muscle);
  if (tiredMuscles.length > 0) {
    insights.push(`Your ${tiredMuscles.slice(0, 2).join(' and ')} may need additional recovery before your next session.`);
  }

  if (recoveryScore < 40) {
    insights.push('Your overall recovery score is low. Prioritize sleep, hydration, and active rest today.');
  }

  return insights.slice(0, 5);
}

/* ── Main Engine ─────────────────────────────────── */
export async function runTrainingAnalysisEngine(userId: string): Promise<void> {
  try {
    await connectDB();

    const now       = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    /* Fetch this week's logs */
    const weekLogs = await ProgressLog.find({
      userId,
      date: { $gte: weekStart, $lt: weekEnd },
    }).lean();

    /* Fetch last 30 days for streak and muscle recovery context */
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLogs = await ProgressLog.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).lean();

    const workoutLogs   = weekLogs.filter(l => l.type === 'workout');
    const nutritionLogs = weekLogs.filter(l => l.type === 'nutrition');
    const healthLogs    = weekLogs.filter(l => l.type === 'health');

    /* ── Core Metrics ──────────────────────────── */
    const weeklyFrequency = workoutLogs.length;

    const weeklyVolume = workoutLogs.reduce((total, log) => {
      const exercises = (log.exercises ?? []) as Array<{ sets: number; reps: number; weight: number }>;
      return total + exercises.reduce((s, e) => s + e.sets, 0);
    }, 0);

    const avgSleepHours = healthLogs.length > 0
      ? healthLogs.reduce((s, l) => s + (l.sleepHours ?? 0), 0) / healthLogs.length
      : 7;

    const avgCalories = nutritionLogs.length > 0
      ? nutritionLogs.reduce((s, l) => s + (l.calories ?? 0), 0) / nutritionLogs.length
      : 2000;

    const cardioLoadMinutes = healthLogs.reduce((s, l) => {
      const cardio = (l.cardio ?? []) as Array<{ durationMinutes: number }>;
      return s + cardio.reduce((m, c) => m + (c.durationMinutes ?? 0), 0);
    }, 0);

    /* ── Consecutive Training Days ──────────────── */
    const uniqueWorkoutDates = [...new Set(
      recentLogs.filter(l => l.type === 'workout').map(l => new Date(l.date).toISOString().slice(0, 10))
    )].sort().reverse();

    let consecutiveTrainingDays = 0;
    const todayStr = now.toISOString().slice(0, 10);
    if (uniqueWorkoutDates[0] === todayStr || uniqueWorkoutDates[0] === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
      for (let i = 0; i < uniqueWorkoutDates.length - 1; i++) {
        const curr = new Date(uniqueWorkoutDates[i]!);
        const next = new Date(uniqueWorkoutDates[i + 1]!);
        const diff = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) consecutiveTrainingDays++;
        else break;
      }
      consecutiveTrainingDays++;
    }

    /* ── Scoring ─────────────────────────────────── */
    const volumeScore    = scoreInRange(weeklyVolume, THRESHOLDS.weeklyVolume.under, THRESHOLDS.weeklyVolume.over);
    const frequencyScore = scoreInRange(weeklyFrequency, THRESHOLDS.weeklyFrequency.under, THRESHOLDS.weeklyFrequency.over);
    const sleepScore     = clamp(Math.round((avgSleepHours / 8) * 100), 0, 100);
    const cardioScore    = cardioLoadMinutes > THRESHOLDS.cardioMinutes.over
      ? Math.max(0, 100 - Math.round(((cardioLoadMinutes - THRESHOLDS.cardioMinutes.over) / 100) * 40))
      : 100;
    const intensityScore = clamp(Math.round(weeklyVolume / 2), 0, 100);
    const consecutivePenalty = consecutiveTrainingDays > THRESHOLDS.consecutiveDays.overLimit
      ? (consecutiveTrainingDays - THRESHOLDS.consecutiveDays.overLimit) * 10
      : 0;

    const recoveryScore = clamp(
      Math.round((sleepScore * 0.4) + (cardioScore * 0.2) + (frequencyScore * 0.2) + (100 - consecutivePenalty) * 0.2),
      0, 100
    );

    const trainingScore = clamp(
      Math.round(
        volumeScore    * 0.30 +
        frequencyScore * 0.25 +
        sleepScore     * 0.20 +
        cardioScore    * 0.10 +
        intensityScore * 0.15
      ) - consecutivePenalty,
      0, 100
    );

    const weeklyIntensityScore = clamp(
      Math.round((weeklyVolume / Math.max(weeklyFrequency, 1)) / 2),
      0, 100
    );

    /* ── Classify Status ─────────────────────────── */
    let trainingStatus: string;
    const isOvertraining =
      weeklyFrequency > THRESHOLDS.weeklyFrequency.over ||
      weeklyVolume > THRESHOLDS.weeklyVolume.over ||
      consecutiveTrainingDays >= THRESHOLDS.consecutiveDays.overLimit ||
      (cardioLoadMinutes > THRESHOLDS.cardioMinutes.over && avgSleepHours < THRESHOLDS.sleepHours.poor);

    const isUndertraining =
      weeklyFrequency < THRESHOLDS.weeklyFrequency.under ||
      weeklyVolume < THRESHOLDS.weeklyVolume.under;

    const isSlightUnder = !isUndertraining && trainingScore < 55;

    if      (isOvertraining)  trainingStatus = 'overtraining';
    else if (isUndertraining) trainingStatus = 'undertraining';
    else if (isSlightUnder)   trainingStatus = 'slight_undertraining';
    else                      trainingStatus = 'optimal';

    /* ── Fatigue Level ───────────────────────────── */
    let fatigueLevel: string;
    if      (recoveryScore >= 75) fatigueLevel = 'low';
    else if (recoveryScore >= 50) fatigueLevel = 'moderate';
    else if (recoveryScore >= 25) fatigueLevel = 'high';
    else                          fatigueLevel = 'critical';

    /* ── Muscle Recovery ─────────────────────────── */
    const muscleSetMap: Record<string, { sets: number; lastDate: Date | null }> = {};
    for (const log of recentLogs.filter(l => l.type === 'workout')) {
      const exercises = (log.exercises ?? []) as Array<{ name: string; sets: number }>;
      for (const ex of exercises) {
        const muscle = detectMuscle(ex.name);
        if (!muscleSetMap[muscle]) muscleSetMap[muscle] = { sets: 0, lastDate: null };
        muscleSetMap[muscle]!.sets += ex.sets;
        const logDate = new Date(log.date);
        if (!muscleSetMap[muscle]!.lastDate || logDate > muscleSetMap[muscle]!.lastDate!) {
          muscleSetMap[muscle]!.lastDate = logDate;
        }
      }
    }

    const muscleRecovery = Object.entries(muscleSetMap).map(([muscle, data]) => {
      const hoursSinceTraining = data.lastDate
        ? (Date.now() - data.lastDate.getTime()) / (1000 * 60 * 60)
        : 999;
      const recoveryPercent = clamp(
        Math.round((hoursSinceTraining / THRESHOLDS.recoveryHours.minimum) * 100),
        0, 100
      );
      const needsRest = hoursSinceTraining < THRESHOLDS.recoveryHours.minimum || data.sets > THRESHOLDS.setsPerMuscle.over;
      return {
        muscle,
        lastTrainedAt: data.lastDate ?? new Date(),
        setsLogged: data.sets,
        recoveryPercent,
        needsRest,
      };
    });

    /* ── Daily Fatigue ───────────────────────────── */
    const dailyFatigue = uniqueWorkoutDates.slice(0, 7).map(dateStr => {
      const dayLogs = recentLogs.filter(l =>
        l.type === 'workout' && new Date(l.date).toISOString().slice(0, 10) === dateStr
      );
      const dayVolume = dayLogs.reduce((s, l) => {
        const ex = (l.exercises ?? []) as Array<{ sets: number }>;
        return s + ex.reduce((a, e) => a + e.sets, 0);
      }, 0);
      const fatigueScore = clamp(Math.round(dayVolume * 2), 0, 100);
      let dayStatus: string;
      if      (fatigueScore >= 80) dayStatus = 'overtraining';
      else if (fatigueScore >= 50) dayStatus = 'optimal';
      else if (fatigueScore >= 20) dayStatus = 'slight_undertraining';
      else                         dayStatus = 'undertraining';
      return { date: dateStr, fatigueScore, status: dayStatus };
    });

    /* ── AI Insights ─────────────────────────────── */
    const aiInsights = buildAiInsights(
      trainingStatus, recoveryScore, consecutiveTrainingDays,
      avgSleepHours, muscleRecovery, weeklyFrequency
    );

    /* ── Upsert Record ───────────────────────────── */
    await TrainingAnalysis.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), weekStartDate: weekStart },
      {
        $set: {
          analyzedAt: new Date(),
          trainingStatus,
          trainingScore,
          recoveryScore,
          fatigueLevel,
          weeklyIntensityScore,
          weeklyVolume,
          weeklyFrequency,
          avgSleepHours,
          avgCalories,
          cardioLoadMinutes,
          consecutiveTrainingDays,
          muscleRecovery,
          aiInsights,
          dailyFatigue,
        },
      },
      { upsert: true, new: true }
    );

  } catch (error: unknown) {
    /* Engine errors must NEVER crash the parent request */
    console.error('[TRAINING ANALYSIS ENGINE ERROR]', error);
  }
}
