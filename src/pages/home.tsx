import { useEffect, useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import { getDailyStats, getMealRecords, getCurrentWorkoutPlan, getCurrentDietPlan, type WorkoutPlanResponse } from '../lib/api'
import { buildHomeDisplay, type HomeDisplayData } from '../lib/page-data'
import { getUserId, isLoggedIn } from '../lib/auth-store'

interface CalorieTarget {
  ready: boolean
  message?: string
  bmr?: number
  tdee?: number
  target?: number
  label?: string
}

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function todayLabel(): string {
  return DAY_LABELS[new Date().getDay()]
}

function HomePage() {
  const [data, setData] = useState<HomeDisplayData>({ totalCalories: null, mealCount: null, totalProtein: null, mealSummary: '加载中', planSummary: '加载中', loading: true, error: null })
  const [calorieTarget, setCalorieTarget] = useState<CalorieTarget | null>(null)
  const [planData, setPlanData] = useState<WorkoutPlanResponse['data'] | null>(null)

  const todayTraining = useMemo(() => {
    if (!planData) return null
    const schedule = (planData.planContent as any)?.weeklySchedule ?? []
    return schedule.find((d: any) => d.dayLabel === todayLabel()) || null
  }, [planData])

  const [dietAdvice, setDietAdvice] = useState<any>(null)

  useEffect(() => {
    const date = currentDate()
    Promise.all([getDailyStats(date), getMealRecords(date), getCurrentWorkoutPlan()])
      .then(([stats, meals, plan]) => {
        setData(buildHomeDisplay(stats, meals, plan))
        setPlanData(plan.data)
      })
      .catch((err: Error) => setData(buildHomeDisplay(null, null, null, err.message)))

    fetch('/api/calorie-target', { headers: { 'x-user-id': getUserId() } })
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .then((body) => setCalorieTarget(body.data))
      .catch(() => {})

    getCurrentDietPlan()
      .then((res) => { if (res.data?.content) setDietAdvice(res.data.content) })
      .catch(() => {})
  }, [])

  if (!isLoggedIn()) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>今天</Text>
          <Text className='page-subtitle'>请先登录</Text>
        </View>
        <View className='card'>
          <Text className='card__text'>请前往"我的"页面登录或注册账号</Text>
        </View>
      </View>
    )
  }

  if (data.loading && data.totalCalories === null) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>今天</Text>
          <Text className='page-subtitle'>加载中...</Text>
        </View>
        <View className='card'><Text className='card__text'>正在获取数据</Text></View>
      </View>
    )
  }

  if (data.error) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>今天</Text>
          <Text className='page-subtitle'>数据加载失败</Text>
        </View>
        <View className='card'><Text className='card__text'>{data.error}</Text></View>
      </View>
    )
  }

  const currentKcal = data.totalCalories ?? 0
  const targetKcal = calorieTarget?.ready ? calorieTarget.target! : null
  const progressPercent = targetKcal ? Math.min(100, Math.round((currentKcal / targetKcal) * 100)) : null

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>今天</Text>
        <Text className='page-subtitle'>轻量记录，稳步推进</Text>
      </View>

      {/* ── Calorie target card ── */}
      {calorieTarget && (
        <View className='card' style={{ background: 'linear-gradient(135deg, #e8f8ef 0%, #f0faf4 100%)', border: '1px solid #d4f0df' }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: calorieTarget.ready ? '16rpx' : '0' }}>
            <Text className='card__title'>热量目标</Text>
            {calorieTarget.ready && (
              <View style={{ background: '#fff', padding: '2rpx 14rpx', borderRadius: '20rpx', border: '1px solid #d4f0df' }}>
                <Text style={{ fontSize: '22rpx', color: '#07c160' }}>{calorieTarget.label}</Text>
              </View>
            )}
          </View>
          {calorieTarget.ready ? (
            <>
              <View style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16rpx' }}>
                <View style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '44rpx', fontWeight: '700', color: '#07c160', display: 'block' }}>{calorieTarget.target}</Text>
                  <Text className='hero-card__unit'>目标 kcal</Text>
                </View>
                <View style={{ width: '1px', background: '#d4f0df' }} />
                <View style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '36rpx', fontWeight: '600', color: '#38384d', display: 'block' }}>{currentKcal}</Text>
                  <Text className='hero-card__unit'>已摄入 kcal</Text>
                </View>
                <View style={{ width: '1px', background: '#d4f0df' }} />
                <View style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '28rpx', fontWeight: '500', color: '#8e8ea0', display: 'block' }}>{calorieTarget.bmr}</Text>
                  <Text className='hero-card__unit'>基础代谢</Text>
                </View>
              </View>
              {/* Progress bar */}
              {progressPercent !== null && (
                <View style={{ background: '#d4f0df', borderRadius: '6rpx', height: '10rpx' }}>
                  <View style={{ background: progressPercent > 90 ? '#e74c3c' : '#07c160', borderRadius: '6rpx', height: '10rpx', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
                </View>
              )}
            </>
          ) : (
            <Text className='card__text' style={{ color: '#f0a030', fontSize: '24rpx' }}>{calorieTarget.message}</Text>
          )}
        </View>
      )}

      {/* ── Today's overview ── */}
      <View className='card'>
        <Text className='card__title' style={{ marginBottom: '16rpx' }}>今日概览</Text>
        <View className='hero-card__stats'>
          <View>
            <Text className='hero-card__value'>{data.totalCalories ?? '--'}</Text>
            <Text className='hero-card__unit'>摄入 kcal</Text>
          </View>
          <View>
            <Text className='hero-card__value'>{data.mealCount ?? '--'}</Text>
            <Text className='hero-card__unit'>餐次</Text>
          </View>
          <View>
            <Text className='hero-card__value'>{data.totalProtein ?? '--'}g</Text>
            <Text className='hero-card__unit'>蛋白质</Text>
          </View>
        </View>
      </View>

      {/* ── Diet & plan summaries ── */}
      <View style={{ display: 'flex', marginBottom: '20rpx' }}>
        <View className='card card--compact' style={{ flex: 1, marginRight: '12rpx', marginBottom: '0' }}>
          <Text className='card__title' style={{ marginBottom: '8rpx' }}>饮食</Text>
          <Text className='card__text'>{data.mealSummary}</Text>
        </View>
        <View className='card card--compact' style={{ flex: 1, marginRight: '0', marginBottom: '0' }}>
          <Text className='card__title' style={{ marginBottom: '8rpx' }}>计划</Text>
          <Text className='card__text'>{data.planSummary}</Text>
        </View>
      </View>

      {/* Today's training */}
      <View className='card' style={{ background: todayTraining ? '#e8f8ef' : '#fef9f0', border: todayTraining ? '1px solid #d4f0df' : '1px solid #fde8c8' }}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: todayTraining ? '12rpx' : '0' }}>
          <Text className='card__title'>今天 · {todayLabel()}</Text>
          {todayTraining ? (
            <View style={{ background: '#07c160', padding: '2rpx 14rpx', borderRadius: '20rpx' }}>
              <Text style={{ fontSize: '20rpx', color: '#fff' }}>训练日</Text>
            </View>
          ) : (
            <View style={{ background: '#f0a030', padding: '2rpx 14rpx', borderRadius: '20rpx' }}>
              <Text style={{ fontSize: '20rpx', color: '#fff' }}>休息日</Text>
            </View>
          )}
        </View>
        {todayTraining ? (
          <>
            <Text className='card__text' style={{ fontWeight: '500', color: '#38384d', marginBottom: '6rpx' }}>
              {todayTraining.focus} · {todayTraining.durationMinutes} 分钟
            </Text>
            {Array.isArray(todayTraining.exercises) && todayTraining.exercises.map((ex: string, j: number) => (
              <View key={j} style={{ background: '#fff', padding: '6rpx 14rpx', borderRadius: '6rpx', marginBottom: '4rpx' }}>
                <Text style={{ fontSize: '22rpx', color: '#1a1a2e' }}>{ex}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text className='card__text' style={{ color: '#8e8ea0' }}>今日休息</Text>
        )}
      </View>

      {/* Diet advice */}
      {dietAdvice && (
        <View className='card' style={{ borderLeft: '4px solid #07c160' }}>
          <Text className='card__title' style={{ marginBottom: '10rpx' }}>今日饮食</Text>
          <Text className='card__text' style={{ marginBottom: '4rpx' }}>
            目标 {dietAdvice.dailyCalories} kcal
            {dietAdvice.macros && ` · 蛋白质 ${dietAdvice.macros.protein}g · 脂肪 ${dietAdvice.macros.fat}g · 碳水 ${dietAdvice.macros.carbs}g`}
          </Text>
          {dietAdvice.principles?.length > 0 && (
            <Text className='card__text' style={{ marginBottom: '6rpx', color: '#8e8ea0' }}>{dietAdvice.principles.slice(0, 2).join('；')}</Text>
          )}
          {dietAdvice.mealSuggestions?.map((meal: any, i: number) => (
            <View key={i} style={{ marginTop: '8rpx' }}>
              <Text className='food-item__name' style={{ fontSize: '22rpx' }}>{meal.meal}</Text>
              {meal.items?.map((item: any, j: number) => (
                <Text key={j} className='food-item__calories'>
                  {item.name} {item.grams}g · {item.calories}kcal
                  {item.protein !== undefined && ` · 蛋白${item.protein}g`}
                  {item.fat !== undefined && ` · 脂肪${item.fat}g`}
                  {item.carbs !== undefined && ` · 碳水${item.carbs}g`}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default HomePage

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}
