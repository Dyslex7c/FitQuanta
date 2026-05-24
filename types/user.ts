export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'maintenance';
export type DietPreference = 'veg' | 'non-veg' | 'vegan';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type EquipmentLevel = 'none' | 'home' | 'gym';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type BMICategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
export type UserRole = 'admin' | 'trainer' | 'client';

export interface IUserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  country: string;
  activityLevel: ActivityLevel;
  fitnessLevel: FitnessLevel;
  fitnessGoal: FitnessGoal;
  dietPreference: DietPreference;
  budget: BudgetLevel;
  equipment: EquipmentLevel;
  foodAllergies: string[];
  medicalConditions: string[];
  injuries: string[];
  bmi?: number;
  bmiCategory?: BMICategory;
  onboardingComplete: boolean;
  createdAt: string;
}
