export interface FoodItem {
  id: string
  name: string
  sourceType?: string
  userId?: string | null
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
  fiberPer100g: number | null
  sugarPer100g: number | null
  sodiumPer100g: number | null
}

export function filterFoods(foods: FoodItem[], query: string): FoodItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return foods.slice(0, 10)
  return foods.filter((f) => f.name.toLowerCase().includes(q))
}

export function formatCalories(food: FoodItem): string {
  return `${food.caloriesPer100g} kcal/100g`
}

export function formatNutrients(food: FoodItem): string {
  const parts = [
    `蛋白质 ${food.proteinPer100g}g`,
    `脂肪 ${food.fatPer100g}g`,
    `碳水 ${food.carbsPer100g}g`,
  ]
  if (food.fiberPer100g !== null) parts.push(`纤维 ${food.fiberPer100g}g`)
  if (food.sugarPer100g !== null) parts.push(`糖 ${food.sugarPer100g}g`)
  return parts.join(' · ')
}

import { pinyin } from 'pinyin-pro'

function getFirstLetter(name: string): string {
  const py = pinyin(name[0], { toneType: 'none', type: 'array' })
  return (py[0]?.[0] ?? name[0]).toUpperCase()
}

export function groupFoodsByLetter(foods: FoodItem[]): { letter: string; foods: FoodItem[] }[] {
  const groups = new Map<string, FoodItem[]>()
  for (const food of foods) {
    const letter = getFirstLetter(food.name)
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(food)
  }
  const letters = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b))
  return letters.map((letter) => ({ letter, foods: groups.get(letter)! }))
}

export function computeMealNutrients(food: FoodItem, amount: number) {
  const factor = amount
  const round = (v: number) => Math.round(v * factor * 10) / 10
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: round(food.proteinPer100g),
    fat: round(food.fatPer100g),
    carbs: round(food.carbsPer100g),
    fiber: food.fiberPer100g !== null ? round(food.fiberPer100g) : 0,
    sugar: food.sugarPer100g !== null ? round(food.sugarPer100g) : 0,
    sodium: food.sodiumPer100g !== null ? round(food.sodiumPer100g) : 0,
  }
}
