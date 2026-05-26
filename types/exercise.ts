export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quadriceps' | 'hamstrings'
  | 'glutes' | 'calves' | 'full_body';

export type WorkoutType =
  | 'push' | 'pull' | 'legs' | 'compound' | 'isolation'
  | 'cardio' | 'hiit' | 'flexibility' | 'plyometric';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type EquipmentType =
  | 'none' | 'barbell' | 'dumbbell' | 'machine'
  | 'cable' | 'resistance_band' | 'kettlebell'
  | 'bodyweight' | 'pull_up_bar' | 'bench';

export interface IExercise {
  _id: string;
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  workoutType: WorkoutType;
  difficulty: DifficultyLevel;
  youtubeVideoId: string;
  youtubeThumbnail: string;
  youtubeCachedAt: string | null;
  instructions: string[];
  commonMistakes: string[];
  safetyNotes: string[];
  recommendedSets: string;
  recommendedReps: string;
  caloriesBurnedEstimate: number;
  createdAt: string;
}

export interface IExerciseListResponse {
  exercises: IExercise[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IExerciseFilters {
  search: string;
  muscleGroup: MuscleGroup | '';
  workoutType: WorkoutType | '';
  difficulty: DifficultyLevel | '';
  equipment: EquipmentType | '';
  page: number;
}
