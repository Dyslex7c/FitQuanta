import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        if (key) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (e) {
  console.warn('Failed to load .env.local manually:', e);
}

import Achievement from '../models/Achievement';

const ACHIEVEMENTS = [
  /* ── ENGAGEMENT ─────────────────────────────── */
  {
    key: 'profile_complete',
    name: 'First Step',
    description: 'Completed your FitQuanta profile setup.',
    category: 'engagement',
    rarity: 'common',
    icon: '🏁',
    colorHex: '#b8c4d4',
    condition: { type: 'profile_complete', threshold: 1 },
    sortOrder: 1,
  },
  {
    key: 'plan_generated',
    name: 'Plan Activated',
    description: 'Generated your first AI workout and diet plan.',
    category: 'engagement',
    rarity: 'common',
    icon: '⚡',
    colorHex: '#f07028',
    condition: { type: 'plan_generated', threshold: 1 },
    sortOrder: 2,
  },
  /* ── CONSISTENCY / STREAKS ───────────────────── */
  {
    key: 'first_workout',
    name: 'First Rep',
    description: 'Logged your very first workout. The journey begins.',
    category: 'consistency',
    rarity: 'common',
    icon: '💪',
    colorHex: '#3ecfb2',
    condition: { type: 'workout_count', threshold: 1 },
    sortOrder: 10,
  },
  {
    key: 'streak_7',
    name: '7 Day Warrior',
    description: 'Logged workouts for 7 consecutive days without breaking.',
    category: 'streaks',
    rarity: 'rare',
    icon: '🔥',
    colorHex: '#f07028',
    condition: { type: 'workout_streak', threshold: 7 },
    sortOrder: 11,
  },
  {
    key: 'streak_30',
    name: 'Discipline King',
    description: '30 consecutive days of workout logging. Unstoppable.',
    category: 'streaks',
    rarity: 'epic',
    icon: '👑',
    colorHex: '#e8a820',
    condition: { type: 'workout_streak', threshold: 30 },
    sortOrder: 12,
  },
  {
    key: 'streak_100',
    name: 'Centurion',
    description: '100 consecutive days. You are built different.',
    category: 'streaks',
    rarity: 'legendary',
    icon: '🏆',
    colorHex: '#9060f0',
    condition: { type: 'workout_streak', threshold: 100 },
    sortOrder: 13,
  },
  /* ── WORKOUT MILESTONES ──────────────────────── */
  {
    key: 'workouts_10',
    name: 'Getting Started',
    description: 'Completed 10 workout sessions.',
    category: 'consistency',
    rarity: 'common',
    icon: '🎯',
    colorHex: '#3ecfb2',
    condition: { type: 'workout_count', threshold: 10 },
    sortOrder: 20,
  },
  {
    key: 'workouts_50',
    name: 'Fifty Strong',
    description: 'Logged 50 workout sessions. Seriously committed.',
    category: 'consistency',
    rarity: 'rare',
    icon: '🦾',
    colorHex: '#f07028',
    condition: { type: 'workout_count', threshold: 50 },
    sortOrder: 21,
  },
  {
    key: 'workouts_100',
    name: 'Century Club',
    description: '100 workouts logged. You have earned legendary status.',
    category: 'consistency',
    rarity: 'legendary',
    icon: '💯',
    colorHex: '#9060f0',
    condition: { type: 'workout_count', threshold: 100 },
    sortOrder: 22,
  },
  /* ── STRENGTH ────────────────────────────────── */
  {
    key: 'strength_gained',
    name: 'Strength Beast',
    description: 'Increased your total workout volume by over 20%. Getting stronger.',
    category: 'strength',
    rarity: 'epic',
    icon: '🏋️',
    colorHex: '#e8a820',
    condition: { type: 'strength_gained', threshold: 1 },
    sortOrder: 30,
  },
  /* ── NUTRITION ───────────────────────────────── */
  {
    key: 'first_nutrition',
    name: 'Fuel Logged',
    description: 'Logged your first nutrition entry. You are what you eat.',
    category: 'nutrition',
    rarity: 'common',
    icon: '🥗',
    colorHex: '#1ed696',
    condition: { type: 'nutrition_count', threshold: 1 },
    sortOrder: 40,
  },
  {
    key: 'protein_champion',
    name: 'Protein Champion',
    description: 'Hit 100g+ protein on 7 different days. Muscle fuel maximized.',
    category: 'nutrition',
    rarity: 'rare',
    icon: '🥩',
    colorHex: '#f07028',
    condition: { type: 'protein_days_100', threshold: 7 },
    sortOrder: 41,
  },
  /* ── SLEEP ───────────────────────────────────── */
  {
    key: 'sleep_master',
    name: 'Sleep Master',
    description: 'Logged 8+ hours of sleep on 7 or more days. Recovery champion.',
    category: 'sleep',
    rarity: 'rare',
    icon: '😴',
    colorHex: '#7eb8e8',
    condition: { type: 'sleep_days_8plus', threshold: 7 },
    sortOrder: 50,
  },
  /* ── STEPS ───────────────────────────────────── */
  {
    key: 'step_warrior',
    name: 'Step Warrior',
    description: 'Hit 10,000 steps on 10 different days. Always moving.',
    category: 'steps',
    rarity: 'rare',
    icon: '👟',
    colorHex: '#3ecfb2',
    condition: { type: 'step_days_10k', threshold: 10 },
    sortOrder: 60,
  },
  /* ── CARDIO ──────────────────────────────────── */
  {
    key: 'cardio_warrior',
    name: 'Cardio Warrior',
    description: 'Logged cardio sessions on 10 different days. Heart of steel.',
    category: 'cardio',
    rarity: 'rare',
    icon: '🏃',
    colorHex: '#1ed696',
    condition: { type: 'cardio_sessions', threshold: 10 },
    sortOrder: 70,
  },
  /* ── WEIGHT LOSS ─────────────────────────────── */
  {
    key: 'fat_loss_milestone',
    name: 'Fat Loss Milestone',
    description: 'Lost 3kg or more since you started tracking. Real progress.',
    category: 'weight_loss',
    rarity: 'epic',
    icon: '📉',
    colorHex: '#e8a820',
    condition: { type: 'weight_lost_kg', threshold: 3 },
    sortOrder: 80,
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const data of ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate(
      { key: data.key },
      data,
      { upsert: true, new: true }
    );
    console.log(`✓ Seeded: ${data.name}`);
  }

  console.log('All achievements seeded.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
