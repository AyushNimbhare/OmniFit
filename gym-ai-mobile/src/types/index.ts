export interface User {
  id: number;
  email: string;
  name: string;
  firebase_uid: string;
  created_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  is_custom: boolean;
  user_id?: number | null;
}

export interface WorkoutLog {
  id?: number;
  exercise_id: number;
  exercise_name?: string;
  set_number: number;
  reps: number;
  weight: number;
}

export interface Workout {
  id: number;
  user_id: number;
  date: string;
  duration: number;
  name: string;
  logs: WorkoutLog[];
}

export interface NutritionLog {
  id: number;
  user_id: number;
  date: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: string;
}

export interface BodyMetric {
  id: number;
  user_id: number;
  date: string;
  weight: number;
  body_fat?: number | null;
  waist?: number | null;
}

export interface AIInsight {
  id: number;
  user_id: number;
  date: string;
  type: string;
  content: string;
}

export interface ScannedFoodResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: string;
}
