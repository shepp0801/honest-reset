export const WORKOUT_TYPES = [
  'Cardio',
  'Strength',
  'Flexibility',
  'Sports',
  'Walking',
  'Other',
] as const

export const INTENSITIES = ['Low', 'Moderate', 'High'] as const

export type WorkoutType = (typeof WORKOUT_TYPES)[number]
export type WorkoutIntensity = (typeof INTENSITIES)[number]
