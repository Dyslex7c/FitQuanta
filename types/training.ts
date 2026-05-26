export type TrainingStatus =
  | 'optimal'
  | 'undertraining'
  | 'slight_undertraining'
  | 'overtraining';

export type FatigueLevel = 'low' | 'moderate' | 'high' | 'critical';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'cardio';

export interface IMuscleRecovery {
  muscle: MuscleGroup;
  lastTrainedAt: string;
  setsLogged: number;
  recoveryPercent: number;       /* 0–100 */
  needsRest: boolean;
}

export interface ITrainingAnalysis {
  _id: string;
  userId: string;
  analyzedAt: string;
  weekStartDate: string;

  trainingStatus: TrainingStatus;
  trainingScore: number;          /* 0–100 overall score */
  recoveryScore: number;          /* 0–100 */
  fatigueLevel: FatigueLevel;
  weeklyIntensityScore: number;   /* 0–100 */

  weeklyVolume: number;           /* total sets this week */
  weeklyFrequency: number;        /* workout days this week */
  avgSleepHours: number;
  avgCalories: number;
  cardioLoadMinutes: number;
  consecutiveTrainingDays: number;

  muscleRecovery: IMuscleRecovery[];
  aiInsights: string[];           /* AI-generated feedback strings */

  dailyFatigue: Array<{
    date: string;
    fatigueScore: number;         /* 0–100 */
    status: TrainingStatus;
  }>;
}

export interface ITrainingScoreBreakdown {
  volumeScore: number;
  frequencyScore: number;
  recoveryScore: number;
  sleepScore: number;
  intensityScore: number;
  cardioScore: number;
  overallScore: number;
  status: TrainingStatus;
  colorHex: string;
}

export const STATUS_COLOR: Record<TrainingStatus, string> = {
  optimal:             '#22c55e',   /* green  */
  slight_undertraining:'#eab308',   /* yellow */
  undertraining:       '#ef4444',   /* red    */
  overtraining:        '#7f1d1d',   /* dark red */
};

export const STATUS_LABEL: Record<TrainingStatus, string> = {
  optimal:             'Optimal Training',
  slight_undertraining:'Slightly Low Intensity',
  undertraining:       'Undertraining',
  overtraining:        'Overtraining',
};
