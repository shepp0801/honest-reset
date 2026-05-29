export interface DailyLog {
  id: string
  user_id: string
  log_date: string
  weight_lbs: number | null
  steps: number | null
  miles_walked: number | null
  water_oz: number | null
  notes: string | null
  blood_glucose: number | null
  systolic_bp: number | null
  diastolic_bp: number | null
  resting_heart_rate: number | null
  bedtime: string | null
  wake_time: string | null
  sleep_hours: number | null
  sleep_quality: number | null
  energy_level: number | null
  mood: number | null
  stress_level: number | null
  created_at: string
}

export interface FoodEntry {
  id: string
  user_id: string
  log_date: string
  meal_name: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  meal_type: string | null
  created_at: string
}

export interface LabValue {
  id: string
  user_id: string
  recorded_date: string
  test_name: string
  value: number
  unit: string | null
  notes: string | null
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  log_date: string
  exercise_name: string
  workout_type: string | null
  duration_minutes: number | null
  sets: number | null
  reps: number | null
  weight_lbs: number | null
  distance_miles: number | null
  heart_rate_avg: number | null
  heart_rate_max: number | null
  intensity: string | null
  notes: string | null
  created_at: string
}

export interface Supplement {
  id: string
  user_id: string
  log_date: string
  name: string
  dosage: string | null
  time_taken: string | null
  created_at: string
}

export interface Medication {
  id: string
  user_id: string
  log_date: string
  name: string
  dosage: string | null
  time_taken: string | null
  created_at: string
}

export interface BloodPressureReading {
  id: string
  user_id: string
  recorded_at: string
  systolic: number
  diastolic: number
  pulse: number | null
  notes: string | null
  created_at: string
}

export interface MedicationItem {
  id: string
  user_id: string
  item_type: 'Medication' | 'Supplement'
  name: string
  dosage: string | null
  schedule_label: string
  scheduled_time: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface MedicationCheckin {
  id: string
  user_id: string
  item_id: string
  taken_date: string
  taken_at: string
  created_at: string
}

export interface DailyLogWithCalories extends DailyLog {
  total_calories: number
}

export interface WeeklyCheckin {
  id: string
  user_id: string
  week_start: string
  went_well: string | null
  was_hard: string | null
  focus_next_week: string | null
  provider_notes: string | null
  created_at: string
  updated_at: string
}

export type ProfileType = 'self' | 'managed'
export type AccountPlan = 'solo' | 'household'

export interface HealthProfile {
  id: string
  account_owner_id: string
  display_name: string
  profile_type: ProfileType
  relationship: string | null
  is_primary: boolean
  created_at: string
}

export interface AccountSettings {
  account_owner_id: string
  plan: AccountPlan
  max_profiles: number
  updated_at: string
}
