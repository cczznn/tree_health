import { useEffect, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { getCurrentWorkoutPlan, getWorkoutCheckins, addWorkoutCheckin, type WorkoutPlanResponse } from '../lib/api'

function PlanPage() {
  const [plan, setPlan] = useState<WorkoutPlanResponse['data'] | null>(null)
  const [checkins, setCheckins] = useState<Array<{ id: string; date: string; note: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    Promise.all([getCurrentWorkoutPlan(), getWorkoutCheckins()])
      .then(([planRes, checkinRes]) => {
        setPlan(planRes.data)
        setCheckins(checkinRes.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const submitCheckin = () => {
    addWorkoutCheckin(note)
      .then(({ data }) => {
        setCheckins((prev) => [data, ...prev])
        setShowCheckin(false)
        setNote('')
      })
  }

  if (loading) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>计划</Text>
          <Text className='page-subtitle'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>计划</Text>
        <Text className='page-subtitle'>训练安排与打卡</Text>
      </View>

      {plan && (
        <>
          <View className='card'>
            <Text className='card__title'>{plan.title}</Text>
            <Text className='card__text'>{plan.goalType} · {plan.frequencyPerWeek} 次/周 · {plan.durationMinutes} 分钟/次</Text>
          </View>

          {(plan.planContent.weeklySchedule ?? []).map((day, i) => (
            <View key={i} className='card card--compact'>
              <Text className='card__title'>{day.dayLabel} · {day.focus}</Text>
              <Text className='card__text'>{day.exercises.join(' / ')} · {day.durationMinutes} 分钟</Text>
            </View>
          ))}
        </>
      )}

      {!showCheckin && (
        <View
          style={{ padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160', marginBottom: '20rpx' }}
          onClick={() => setShowCheckin(true)}
        >
          <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>今日打卡</Text>
        </View>
      )}

      {showCheckin && (
        <View className='card'>
          <Input
            className='search-input'
            type='text'
            placeholder='打卡备注（选填）'
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />

          <View style={{ display: 'flex', marginTop: '16rpx' }}>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb', marginRight: '16rpx' }}
              onClick={() => { setShowCheckin(false); setNote('') }}
            >
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>取消</Text>
            </View>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }}
              onClick={submitCheckin}
            >
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>确认打卡</Text>
            </View>
          </View>
        </View>
      )}

      <View className='card'>
        <Text className='card__title'>打卡记录</Text>
        {checkins.length === 0 ? (
          <Text className='card__text'>暂无打卡记录</Text>
        ) : (
          checkins.map((c) => (
            <View key={c.id} className='food-item'>
              <View>
                <Text className='food-item__name'>训练完成{c.note ? ` · ${c.note}` : ''}</Text>
                <Text className='food-item__calories'>{c.date}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

export default PlanPage
