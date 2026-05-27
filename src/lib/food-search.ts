export interface FoodItem {
  id: string
  name: string
  caloriesPer100g: number
}

export function filterFoods(foods: FoodItem[], query: string): FoodItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return foods.slice(0, 10)
  return foods.filter((f) => f.name.toLowerCase().includes(q))
}

export function formatCalories(food: FoodItem): string {
  return `${food.caloriesPer100g} kcal/100g`
}
