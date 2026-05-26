'use client';
import type { IExerciseFilters, MuscleGroup, WorkoutType, DifficultyLevel, EquipmentType } from '@/types/exercise';

interface Props {
  filters: IExerciseFilters;
  onChange: (filters: Partial<IExerciseFilters>) => void;
  onReset: () => void;
}

const MUSCLE_GROUPS: { value: MuscleGroup | ''; label: string }[] = [
  { value: '', label: 'All muscles' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'core', label: 'Core' },
  { value: 'quadriceps', label: 'Quadriceps' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'full_body', label: 'Full Body' },
];

const WORKOUT_TYPES: { value: WorkoutType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'compound', label: 'Compound' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'flexibility', label: 'Flexibility' },
];

const DIFFICULTIES: { value: DifficultyLevel | ''; label: string }[] = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const EQUIPMENT: { value: EquipmentType | ''; label: string }[] = [
  { value: '', label: 'Any equipment' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_band', label: 'Resistance Band' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
  { value: 'none', label: 'No equipment' },
];

export default function ExerciseFilters({ filters, onChange, onReset }: Props) {
  const hasActive = filters.muscleGroup || filters.workoutType || filters.difficulty || filters.equipment;

  const selectStyle = {
    background: '#13131e',
    border: '1px solid #22223a',
    borderRadius: '7px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#eceef4',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    appearance: 'none' as const,
  };

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
      <select style={selectStyle} value={filters.muscleGroup} onChange={e => onChange({ muscleGroup: e.target.value as MuscleGroup | '', page: 1 })}>
        {MUSCLE_GROUPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select style={selectStyle} value={filters.workoutType} onChange={e => onChange({ workoutType: e.target.value as WorkoutType | '', page: 1 })}>
        {WORKOUT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select style={selectStyle} value={filters.difficulty} onChange={e => onChange({ difficulty: e.target.value as DifficultyLevel | '', page: 1 })}>
        {DIFFICULTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select style={selectStyle} value={filters.equipment} onChange={e => onChange({ equipment: e.target.value as EquipmentType | '', page: 1 })}>
        {EQUIPMENT.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hasActive && (
        <button onClick={onReset} className="btn btn-ghost btn-sm">Clear filters</button>
      )}
    </div>
  );
}
