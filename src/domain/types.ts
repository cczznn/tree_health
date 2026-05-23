export type GoalType = 'fat_loss' | 'muscle_gain' | 'maintain';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSourceType = 'preset' | 'custom';
export type CheckinStatus = 'completed' | 'skipped';
export type RecommendationType = 'diet' | 'exercise' | 'daily_summary';

export interface User {
  id: string;
  name: string;
  goalType: GoalType;
  createdAt: string;
}

export interface Food {
  id: string;
  userId: string | null;
  name: string;
  sourceType: FoodSourceType;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  sodiumPer100g: number;
  createdAt: string;
}

export interface MealRecord {
  id: string;
  userId: string;
  foodId: string;
  mealType: MealType;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sodium: number;
  recordDate: string;
  note: string | null;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  title: string;
  goalType: GoalType;
  frequencyPerWeek: number;
  durationMinutes: number;
  planContent: Record<string, unknown>;
  createdAt: string;
}

export interface WorkoutCheckin {
  id: string;
  userId: string;
  planId: string;
  date: string;
  status: CheckinStatus;
  note: string | null;
}

export interface BodyMetric {
  id: string;
  userId: string;
  metricDate: string;
  weight: number;
  waist: number | null;
  hip: number | null;
  thigh: number | null;
  note: string | null;
}

export interface Recommendation {
  id: string;
  userId: string;
  date: string;
  type: RecommendationType;
  content: string;
  sourceDataSummary: Record<string, unknown>;
}