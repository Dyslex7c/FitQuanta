import type { IProgressLog } from '@/types/progress';

// Sorts logs by date ascending
export function sortByDate(logs: IProgressLog[]): IProgressLog[] {
  return [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Weight chart data
export function getWeightData(logs: IProgressLog[]) {
  return sortByDate(logs)
    .filter(l => l.bodyWeight != null)
    .map(l => ({ 
      date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), 
      weight: l.bodyWeight 
    }));
}

// Workout volume = sum of sets × reps × weight for each workout session
export function getWorkoutVolumeData(logs: IProgressLog[]) {
  return sortByDate(logs)
    .filter(l => l.type === 'workout' && l.exercises && l.exercises.length > 0)
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      volume: l.exercises!.reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0),
    }));
}

// Macro chart data
export function getMacroData(logs: IProgressLog[]) {
  return sortByDate(logs)
    .filter(l => l.type === 'nutrition')
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      protein: l.protein ?? 0,
      carbs: l.carbs ?? 0,
      fats: l.fats ?? 0,
    }));
}

// Calorie data
export function getCalorieData(logs: IProgressLog[]) {
  return sortByDate(logs)
    .filter(l => l.type === 'nutrition' && l.calories != null)
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      calories: l.calories ?? 0,
    }));
}

// Sleep data
export function getSleepData(logs: IProgressLog[]) {
  return sortByDate(logs)
    .filter(l => l.type === 'health' && l.sleepHours != null)
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      hours: l.sleepHours ?? 0,
    }));
}

// Steps data
export function getStepsData(logs: IProgressLog[]) {
  return sortByDate(logs)
    .filter(l => l.type === 'health' && l.steps != null)
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      steps: l.steps ?? 0,
    }));
}
