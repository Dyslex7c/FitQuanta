export type BadgeCategory =
  | 'consistency'
  | 'strength'
  | 'weight_loss'
  | 'muscle_gain'
  | 'streaks'
  | 'nutrition'
  | 'sleep'
  | 'steps'
  | 'cardio'
  | 'engagement';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface IAchievement {
  _id: string;
  key: string;                 /* unique identifier used in engine logic */
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string;                /* emoji icon */
  colorHex: string;            /* accent color for the badge card */
  condition: {
    type: string;              /* e.g. 'workout_count', 'streak_days' */
    threshold: number;         /* e.g. 7, 30, 100 */
  };
  sortOrder: number;
}

export interface IUserAchievement {
  _id: string;
  userId: string;
  achievementId: string;
  achievement: IAchievement;
  unlockedAt: string;
  seen: boolean;
}

export interface IRewardTier {
  label: string;
  badgesRequired: number;
  rewardDescription: string;
  discountPercent: number;
  perks: string[];
  colorHex: string;
}

export interface IUserReward {
  _id: string;
  userId: string;
  totalBadgesEarned: number;
  currentTierIndex: number;
  currentTier: IRewardTier | null;
  nextTier: IRewardTier | null;
  badgesUntilNextTier: number;
  discountCodes: Array<{
    code: string;
    discountPercent: number;
    used: boolean;
    expiresAt: string;
  }>;
}

export interface IAchievementWithProgress extends IAchievement {
  earned: boolean;
  unlockedAt?: string;
  progress?: number;           /* 0–100 percent toward unlocking */
  currentValue?: number;       /* e.g. "47 workouts" toward 100 */
}
