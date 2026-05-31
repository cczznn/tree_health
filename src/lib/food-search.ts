export interface FoodItem {
  id: string
  name: string
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

// Simple first-char pinyin mapping for 100 preset foods
const PINYIN_MAP: Record<string, string> = {
  鸡: 'J', 鸭: 'Y', 鹅: 'E', 猪: 'Z', 牛: 'N', 羊: 'Y', 鱼: 'Y', 虾: 'X', 蟹: 'X', 贝: 'B',
  鸡: 'J', 蛋: 'D', 奶: 'N', 豆: 'D', 米: 'M', 面: 'M', 馒: 'M', 包: 'B', 饼: 'B', 饭: 'F',
  白: 'B', 全: 'Q', 燕: 'Y', 糙: 'C', 小: 'X', 玉: 'Y', 紫: 'Z', 红: 'H', 土: 'T', 山: 'S',
  西: 'X', 南: 'N', 冬: 'D', 黄: 'H', 绿: 'L', 菠: 'B', 芹: 'Q', 韭: 'J', 蒜: 'S', 姜: 'J',
  辣: 'L', 甜: 'T', 苦: 'K', 酸: 'S', 苹: 'P', 香: 'X', 芒: 'M', 葡: 'P', 橘: 'J', 橙: 'C',
  柚: 'Y', 柠: 'N', 草: 'C', 蓝: 'L', 樱: 'Y', 桃: 'T', 李: 'L', 杏: 'X', 枣: 'Z', 荔: 'L',
  龙: 'L', 火: 'H', 石: 'S', 木: 'M', 椰: 'Y', 花: 'H', 生: 'S', 腰: 'Y', 核: 'H', 松: 'S',
  榛: 'Z', 开心: 'K', 芝: 'Z', 麻: 'M', 腐: 'F', 干: 'G', 丝: 'S', 粉: 'F', 皮: 'P', 瓜: 'G',
  茄: 'Q', 番: 'F', 胡: 'H', 萝: 'L', 藕: 'O', 笋: 'S', 菇: 'G', 耳: 'E', 紫菜: 'Z', 海: 'H',
  带: 'D', 蛤: 'G', 扇: 'S', 海参: 'H', 鲍: 'B', 乌: 'W', 鱿: 'Y', 墨: 'M', 三文: 'S', 金: 'J',
  沙: 'S', 秋: 'Q', 刀: 'D', 鲈: 'L', 鳕: 'X', 鲫: 'J', 鲤: 'L', 鲢: 'L', 鳊: 'B', 鳙: 'Y',
  青: 'Q', 泥: 'N', 黄鳝: 'H', 田: 'T', 螺: 'L', 河: 'H', 紫: 'Z', 马: 'M', 驴: 'L', 兔: 'T',
  鸽: 'G', 火鸡: 'H', 鹌: 'A', 鹑: 'C', 蛇: 'S', 蛙: 'W', 蚕: 'C', 蜂: 'F', 蝗: 'H', 蚂: 'M',
  油: 'Y', 盐: 'Y', 酱: 'J', 醋: 'C', 糖: 'T', 料: 'L', 味: 'W', 啤: 'P', 白: 'B',
}

function getFirstLetter(name: string): string {
  // Try first two chars (for compounds like 三文, 开心, etc.)
  const two = name.slice(0, 2)
  if (PINYIN_MAP[two]) return PINYIN_MAP[two]
  // Fall back to first char
  const one = name[0]
  return PINYIN_MAP[one] || one
}

export function groupFoodsByLetter(foods: FoodItem[]): { letter: string; foods: FoodItem[] }[] {
  const groups = new Map<string, FoodItem[]>()
  for (const food of foods) {
    const letter = getFirstLetter(food.name).toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(food)
  }
  const result = Array.from(groups.entries()).map(([letter, items]) => ({ letter, foods: items }))
  result.sort((a, b) => a.letter.localeCompare(b.letter, 'zh'))
  return result
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
