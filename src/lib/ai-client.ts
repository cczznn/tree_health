import OpenAI from 'openai'
import { getDeepSeekKey } from './ai-config'

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: getDeepSeekKey(),
      baseURL: 'https://api.deepseek.com/v1',
    })
  }
  return _client
}

export interface AiPlanInput {
  gender: 'male' | 'female'
  age: number
  weightKg: number
  heightCm: number
  goalType: 'fat_loss' | 'muscle_gain' | 'maintain'
}

function goalLabel(g: string) {
  return g === 'fat_loss' ? '减脂' : g === 'muscle_gain' ? '增肌' : '维持体重'
}

function userProfile(input: AiPlanInput): string {
  return `性别: ${input.gender === 'male' ? '男' : '女'}
年龄: ${input.age}
体重: ${input.weightKg}kg
身高: ${input.heightCm}cm
目标: ${goalLabel(input.goalType)}`
}

async function callAi(systemPrompt: string, userPrompt: string): Promise<string> {
  const client = getClient()
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    temperature: 0.1,
    messages: [
      { role: 'system', content: '你是专业健身营养师。只输出纯JSON，不含markdown。' },
      { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
    ],
    response_format: { type: 'json_object' },
  })
  return response.choices[0]?.message?.content || ''
}

// ── Generate training plan only ──
export interface TrainingQuestionnaire {
  daysPerWeek: number
  minutesPerSession: number
  targetAreas: string[]
  experience: string
  location: string
  equipment: string[]
  intensity: string
}

export async function generateTraining(input: AiPlanInput, q?: TrainingQuestionnaire): Promise<string> {
  const qText = q ? `
训练偏好问卷：
- 一周练几天：${q.daysPerWeek} 天
- 一次练多久：${q.minutesPerSession} 分钟
- 目标部位：${q.targetAreas.join('、') || '全身'}
- 经验水平：${q.experience === 'beginner' ? '新手' : q.experience === 'intermediate' ? '有一定基础' : '进阶'}
- 训练场所：${q.location === 'home' ? '居家' : q.location === 'gym' ? '健身房' : '都可以'}
- 可用器械：${q.equipment.join('、') || '无特殊器械'}
- 训练强度：${q.intensity === 'low' ? '温和' : q.intensity === 'medium' ? '中等' : '高强度'}
` : ''

  return callAi(
    `你是一个专业健身教练。根据用户数据生成个性化训练计划。只返回纯 JSON，不要 markdown。

{
  "title": "计划名称",
  "frequencyPerWeek": 4,
  "durationMinutes": 45,
  "weeklySchedule": [
    { "dayLabel": "周一", "focus": "训练重点", "durationMinutes": 45, "exercises": ["动作 组数×次数"] }
  ]
}

规则：
- frequencyPerWeek 和 durationMinutes 使用问卷中指定的值
- 根据经验水平调整动作难度和训练量
- 根据训练场所和器械选择适合的动作
- 根据目标部位分配训练日的重点肌群
- weeklySchedule 训练日数量 = frequencyPerWeek`,
    userProfile(input) + qText,
  )
}

// ── Generate diet plan only ──
export async function generateDiet(input: AiPlanInput, activityLevel?: string): Promise<string> {
  const { calcDailyTarget, getActivityFactor } = await import('./calorie-calc')
  const al = (activityLevel || 'sedentary') as any
  const factor = getActivityFactor(al)
  const alLabel = ({sedentary:'久坐不动',light:'轻度活动(每周1-2天)',moderate:'中度活动(每周3-5天)',active:'高度活动(每周6-7天)',athlete:'运动员(每天高强度)'} as any)[al] || '久坐不动'

  let calorieRef = ''
  try {
    const target = calcDailyTarget({ weightKg: input.weightKg, heightCm: input.heightCm, age: input.age, gender: input.gender, goalType: input.goalType, activityLevel: al })
    calorieRef = `\n活动量：${alLabel}（系数 ${factor}）\n参考热量目标：${target.target} kcal（BMR: ${target.bmr}, TDEE: ${target.tdee}）\n请将 dailyCalories 设置为接近此参考值，并根据活动量调整蛋白质和碳水比例。`
  } catch { /* ignore */ }

  return callAi(
    `你是一个专业营养师。根据用户数据生成个性化饮食计划。输出严格 JSON，不要 markdown。

输出格式（每个食物对象必须包含全部字段）：
{
  "dietAdvice": {
    "dailyCalories": 1800,
    "principles": ["原则1"],
    "macros": { "protein": 120, "fat": 50, "carbs": 200 },
    "mealSuggestions": [
      { "meal": "早餐", "items": [ { "name": "食物名", "grams": 50, "calories": 184, "protein": 6, "fat": 4, "carbs": 30 } ] }
    ]
  }
}

必须遵守：
- 每个 items 中的食物对象必须包含 protein、fat、carbs、grams、calories、name 六个字段，缺一不可
- macros 对象必须包含 protein、fat、carbs 且数值 = 所有餐食中同名营养素相加的总和
- 食物尽量用中国常见食物
- 三餐总热量接近 dailyCalories`,
    userProfile(input) + calorieRef,
  )
}

// ── Generate both (original combined) ──
export async function generateAiPlan(input: AiPlanInput): Promise<string> {
  const { calcDailyTarget } = await import('./calorie-calc')
  let calorieRef = ''
  try {
    const target = calcDailyTarget({ weightKg: input.weightKg, heightCm: input.heightCm, age: input.age, gender: input.gender, goalType: input.goalType })
    calorieRef = `\n参考热量目标：${target.target} kcal（BMR: ${target.bmr}）\n请将 dietAdvice.dailyCalories 设置为接近此参考值。`
  } catch { /* ignore */ }

  return callAi(
    `你是一个专业的健身教练和营养师。根据用户数据生成个性化训练计划和饮食建议。只返回纯 JSON，不要 markdown。

{
  "title": "计划名称",
  "frequencyPerWeek": 4,
  "durationMinutes": 45,
  "weeklySchedule": [
    { "dayLabel": "周一", "focus": "训练重点", "durationMinutes": 45, "exercises": ["动作名 组数×次数"] }
  ],
  "dietAdvice": {
    "dailyCalories": 1800,
    "principles": ["原则1"],
    "macros": { "protein": 120, "fat": 50, "carbs": 200 },
    "mealSuggestions": [
      {
        "meal": "早餐",
        "items": [
          { "name": "食物名", "grams": 50, "calories": 184, "protein": 6, "fat": 4, "carbs": 30 }
        ]
      }
    ]
  }
}

规则：weeklySchedule 训练日数量 = frequencyPerWeek；每份食物必须列出 protein/fat/carbs；macros 为全天总和且与各食物加总一致`,
    userProfile(input) + calorieRef,
  )
}
