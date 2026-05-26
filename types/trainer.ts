export type TrainerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type Specialization =
  | 'weight_loss' | 'muscle_gain' | 'strength' | 'cardio'
  | 'yoga' | 'hiit' | 'rehabilitation' | 'sports' | 'nutrition';

export interface ITrainer {
  _id: string;
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  country: string;
  location: string;
  bio: string;
  certifications: string[];
  yearsOfExperience: number;
  clientsTrained: number;
  specializations: Specialization[];
  profilePhotoUrl: string;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  status: TrainerStatus;
  averageRating: number;
  totalReviews: number;
  plans: ITrainerPlan[];
  createdAt: string;
}

export interface ITrainerPlan {
  _id: string;
  trainerId: string;
  name: string;
  durationWeeks: number;
  priceINR: number;
  features: string[];
  includesDiet: boolean;
  includesWorkout: boolean;
  includesChat: boolean;
  isActive: boolean;
}

export interface ITrainerFilters {
  search: string;
  specialization: Specialization | '';
  minExperience: number;
  maxPriceINR: number;
  country: string;
  availability: 'available' | 'busy' | 'unavailable' | '';
  sortBy: 'rating' | 'experience' | 'price_low' | 'price_high';
  page: number;
}
