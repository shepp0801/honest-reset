export const REFLECTION_PROMPTS = [
  'What did your body do well today?',
  'What felt hard this week, and why?',
  'What are you most proud of right now?',
  "Where do you feel progress, even if it's small?",
  'What does your body need more of?',
  'What would you tell a friend who was on your journey?',
  'What has surprised you about this process?',
  'What habit is starting to feel natural?',
  'What are you still struggling to accept?',
  'What would feeling better actually look like for you?',
  'What did you do today that was just for you?',
  'What does rest look like for you right now?',
  'What are you learning about yourself?',
  'What would you like to let go of?',
] as const

/** Same prompt for all users on a given calendar day (day-of-year rotation). */
export function getReflectionPromptForDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const start = new Date(y, 0, 0)
  const day = new Date(y, m - 1, d)
  const dayOfYear = Math.floor((day.getTime() - start.getTime()) / 86_400_000)
  const index = dayOfYear % REFLECTION_PROMPTS.length
  return REFLECTION_PROMPTS[index]
}
