import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { getDailyStats, getMealRecords, getCurrentWorkoutPlan } from '../lib/api'
import { buildHomeDisplay, type HomeDisplayData } from '../lib/page-data'

function HomePage() {
  const [data, setData] = useState<HomeDisplayData>({ totalCalories: null, mealCount: null, totalProtein: null, mealSummary: '加载中', planSummary: '加载中', loading: true, error: null })

  useEffect(() => {
    const date = currentDate()
    Promise.all([getDailyStats(date), getMealRecords(date), getCurrentWorkoutPlan()])
      .then(([stats, meals, plan]) => setData(buildHomeDisplay(stats, meals, plan)))
      .catch((err: Error) => setData(buildHomeDisplay(null, null, null, err.message)))
  }, [])

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

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>今天</Text>
        <Text className='page-subtitle'>轻量记录，稳步推进</Text>
      </View>

      <View className='card hero-card'>
        <Text className='hero-card__label'>今日概览</Text>
        <View className='hero-card__stats'>
          <View>
            <Text className='hero-card__value'>{data.totalCalories ?? '--'}</Text>
            <Text className='hero-card__unit'>kcal</Text>
          </View>
          <View>
            <Text className='hero-card__value'>{data.mealCount ?? '--'}</Text>
            <Text className='hero-card__unit'>记录数</Text>
          </View>
          <View>
            <Text className='hero-card__value'>{data.totalProtein ?? '--'}g</Text>
            <Text className='hero-card__unit'>蛋白质</Text>
          </View>
        </View>
      </View>

      <View className='card card--compact'>
        <View className='card__header'>
          <Text className='card__title'>饮食摘要</Text>
        </View>
        <Text className='card__text'>{data.mealSummary}</Text>
      </View>

      <View className='card card--compact'>
        <View className='card__header'>
          <Text className='card__title'>计划摘要</Text>
        </View>
        <Text className='card__text'>{data.planSummary}</Text>
      </View>
    </View>
  )
}

export default HomePage

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}
