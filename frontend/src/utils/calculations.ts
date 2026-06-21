// BMR: Mifflin-St Jeor (male)
export function calcBMR(weight: number, height: number, age: number): number {
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5)
}

const ACTIVITY = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active:1.9,
}

export function calcTDEE(bmr: number, activity: string): number {
  const m = ACTIVITY[activity as keyof typeof ACTIVITY] || 1.55
  return Math.round(bmr * m)
}

// -500 kcal deficit for ~0.5kg/week loss
export function calcCalorieGoal(tdee: number): number {
  return Math.max(1200, tdee - 500)
}

// Protein: 1.8g per kg body weight (IF + muscle preservation)
export function calcProteinGoal(weight: number): number {
  return Math.round(weight * 1.8)
}

// Days to goal at 0.25 kg/week
export function calcDaysToGoal(current: number, target: number): number {
  if (current <= target) return 0
  return Math.round(((current - target) / 0.25) * 7)
}

// Calories from food
export function calcCalories(kcalPer100g: number, grams: number): number {
  return Math.round((kcalPer100g * grams) / 100)
}

export function calcProtein(proteinPer100g: number, grams: number): number {
  return Math.round((proteinPer100g * grams) / 100)
}
