export interface IExerciseEntry {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface ICardioEntry {
  activity: string;
  durationMinutes: number;
}

export interface IProgressLog {
  _id: string;
  userId: string;
  date: string;
  type: 'workout' | 'nutrition' | 'health';
  exercises?: IExerciseEntry[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  sleepHours?: number;
  steps?: number;
  cardio?: ICardioEntry[];
  bodyWeight?: number;
}
