export interface IExercise {
  name: string;
  sets: number;
  reps: number;
  rest: string;
}

export interface IWorkoutDay {
  day: string;
  exercises: IExercise[];
}

export interface IMeal {
  name: string;
  foods: string[];
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface IDietDay {
  day: string;
  totalCalories?: number;
  meals: IMeal[];
}

export interface IPlan {
  _id: string;
  userId: string;
  type: 'ai_free' | 'trainer';
  workoutPlan: IWorkoutDay[];
  dietPlan: IDietDay[];
  createdAt: string;
}
