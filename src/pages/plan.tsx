import { useEffect, useState, useMemo } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { getCurrentWorkoutPlan, getCurrentDietPlan, getWorkoutCheckins, addWorkoutCheckin, generateAiPlan, type WorkoutPlanResponse } from '../lib/api'
import { requireLogin } from '../lib/auth-store'

interface DietAdvice {
  dailyCalories: number
  principles: string[]
  macros?: { protein: number; fat: number; carbs: number }
  mealSuggestions: Array<{
    meal: string
    items: Array<{ name: string; grams: number; calories: number; protein?: number; fat?: number; carbs?: number }>
  }>
}

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function todayLabel(): string {
  return DAY_LABELS[new Date().getDay()]
}

function PlanPage() {
  const [plan, setPlan] = useState<WorkoutPlanResponse['data'] | null>(null)
  const [dietAdvice, setDietAdvice] = useState<DietAdvice | null>(null)
  const [checkins, setCheckins] = useState<Array<{ id: string; date: string; note: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<'training' | 'diet' | null>(null)
  const [aiError, setAiError] = useState('')
  const [completedToday, setCompletedToday] = useState<string[]>([])
const [successMsg, setSuccessMsg] = useState('')
const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 1500) }

  const toggleExercise = (exerciseName: string) => {
    if (!requireLogin()) return
    addWorkoutCheckin('', exerciseName)
      .then(({ data }) => {
        const completed = data.completedExercises || []
        setCompletedToday(completed)
        const done = completed.includes(exerciseName)
        showSuccess((done ? '已完成' : '已取消') + ` [${completed.length}项]`)
      })
      .catch((err) => setAiError('打卡失败: ' + (err?.message || '未知错误')))
  }

  const [showCheckin, setShowCheckin] = useState(false)
  const [showFullWeek, setShowFullWeek] = useState(false)
  const [showActivityLevel, setShowActivityLevel] = useState(false)
  const [selActivity, setSelActivity] = useState('moderate')
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [note, setNote] = useState('')
  const [qForm, setQForm] = useState({
    daysPerWeek: '4', minutesPerSession: '45',
    targetAreas: [] as string[],
    experience: 'beginner', location: 'anywhere',
    equipment: [] as string[], intensity: 'medium',
  })

  const todayTraining = useMemo(() => {
    if (!plan) return null
    const schedule = plan.planContent?.weeklySchedule ?? []
    return schedule.find((d: any) => d.dayLabel === todayLabel()) || null
  }, [plan])

  const loadPlan = () => {
    setLoading(true)
    let pending = 3
    const done = () => { pending--; if (pending <= 0) setLoading(false) }
    getCurrentWorkoutPlan()
      .then((res) => setPlan(res.data))
      .catch(() => {})
      .finally(done)
    getCurrentDietPlan()
      .then((res) => { if (res.data?.content) setDietAdvice(res.data.content) })
      .catch(() => {})
      .finally(done)
    getWorkoutCheckins()
      .then((res) => {
        setCheckins(res.data)
        const today = new Date().toISOString().slice(0, 10)
        const allCompleted: string[] = []
        ;(res.data || []).forEach((c: any) => {
          if (c.date === today && c.completedExercises) allCompleted.push(...c.completedExercises)
        })
        setCompletedToday(allCompleted)
      })
      .catch(() => {})
      .finally(done)
  }

  useEffect(() => { loadPlan() }, [])

  const handleGenerate = (type: 'training' | 'diet', extra?: any) => {
    if (!requireLogin()) return
    setGenerating(type)
    setAiError('')
    generateAiPlan(type, extra)
      .then((res) => {
        if (type === 'training') { setPlan(res.data.plan) }
        else { setDietAdvice(res.data.dietAdvice) }
        setGenerating(null)
        setShowQuestionnaire(false)
      })
      .catch((err: Error) => {
        setAiError(err.message)
        setGenerating(null)
      })
  }

  const submitQuestionnaire = () => {
    handleGenerate('training', {
      daysPerWeek: parseInt(qForm.daysPerWeek),
      minutesPerSession: parseInt(qForm.minutesPerSession),
      targetAreas: qForm.targetAreas,
      experience: qForm.experience,
      location: qForm.location,
      equipment: qForm.equipment,
      intensity: qForm.intensity,
    })
  }

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]

  const submitCheckin = () => {
    if (!requireLogin()) return
    addWorkoutCheckin(note)
      .then(({ data }) => {
        setCheckins((prev) => [data, ...prev])
        setShowCheckin(false)
        setNote('')
      })
      .catch(() => setAiError('打卡失败，请重试'))
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

      <View style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <View
          style={{ flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center', background: '#07c160' }}
          onClick={() => setShowQuestionnaire(true)}
        >
          <Text style={{ fontSize: '26rpx', color: '#ffffff', fontWeight: '500' }}>
            {generating === 'training' ? '生成中...' : '生成训练计划'}
          </Text>
        </View>
        <View
          style={{ flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center', background: '#07c160' }}
          onClick={() => setShowActivityLevel(true)}
        >
          <Text style={{ fontSize: '26rpx', color: '#ffffff', fontWeight: '500' }}>
            {generating === 'diet' ? '生成中...' : '生成饮食计划'}
          </Text>
        </View>
      </View>

      {aiError && (
        <View className='card' style={{ background: '#fef0ef', border: '1px solid #fecaca' }}>
          <Text style={{ color: '#e74c3c', fontSize: '24rpx' }}>{aiError}</Text>
        </View>
      )}

      {successMsg && (
        <View className='card' style={{ background: '#e8f8ef', border: '1px solid #d4f0df', textAlign: 'center' }}>
          <Text style={{ color: '#07c160', fontSize: '24rpx', fontWeight: '500' }}>{successMsg}</Text>
        </View>
      )}

      {/* Activity level */}
      {showActivityLevel && (
        <View className='card'>
          <Text className='card__title' style={{ marginBottom: '16rpx' }}>选择活动量</Text>
          {[
            {k:'sedentary',v:'久坐不动',d:'几乎不运动，办公室工作',f:'1.2'},
            {k:'light',v:'轻度活动',d:'每周运动 1-2 天',f:'1.375'},
            {k:'moderate',v:'中度活动',d:'每周运动 3-5 天',f:'1.55'},
            {k:'active',v:'高度活动',d:'每周运动 6-7 天',f:'1.725'},
            {k:'athlete',v:'运动员',d:'每天高强度训练或体力劳动',f:'1.9'},
          ].map((o) => {
            const active = selActivity === o.k
            return (
              <View key={o.k}
                style={{
                  padding: '14rpx 16rpx', borderRadius: '12rpx', marginBottom: '8rpx',
                  border: active ? '2px solid #07c160' : '1px solid #e5e7eb',
                  background: active ? '#e8f8ef' : '#fff',
                }}
                onClick={() => setSelActivity(o.k)}
              >
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '26rpx', fontWeight: '500', color: active ? '#07c160' : '#1a1a2e' }}>{o.v}</Text>
                  <Text style={{ fontSize: '22rpx', color: '#8e8ea0' }}>×{o.f}</Text>
                </View>
                <Text style={{ fontSize: '22rpx', color: '#8e8ea0', marginTop: '4rpx' }}>{o.d}</Text>
              </View>
            )
          })}
          <View style={{ display: 'flex', gap: '8px', marginTop: '8rpx' }}>
            <View style={{ flex: 1, padding: '16rpx', borderRadius: '12rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }} onClick={() => setShowActivityLevel(false)}>
              <Text style={{ fontSize: '26rpx', color: '#1f2937' }}>取消</Text>
            </View>
            <View style={{ flex: 1, padding: '16rpx', borderRadius: '12rpx', textAlign: 'center', background: '#07c160' }}
              onClick={() => { setShowActivityLevel(false); handleGenerate('diet', { activityLevel: selActivity }) }}
            >
              <Text style={{ fontSize: '26rpx', color: '#ffffff' }}>开始生成</Text>
            </View>
          </View>
        </View>
      )}

      {/* Questionnaire */}
      {showQuestionnaire && (
        <View className='card'>
          <Text className='card__title' style={{ marginBottom: '16rpx' }}>训练偏好</Text>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>一周练几天？</Text>
            <View className='tag-row'>
              {[3,4,5,6].map(n => (
                <View key={n} className={`meal-type-tag ${qForm.daysPerWeek === String(n) ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, daysPerWeek: String(n)})}>
                  <Text className={qForm.daysPerWeek === String(n) ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{n} 天</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>一次练多久？</Text>
            <View className='tag-row'>
              {[30, 45, 60, 90].map(n => (
                <View key={n} className={`meal-type-tag ${qForm.minutesPerSession === String(n) ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, minutesPerSession: String(n)})}>
                  <Text className={qForm.minutesPerSession === String(n) ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{n} 分钟</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>想练哪些部位？（多选）</Text>
            <View className='tag-row'>
              {['胸', '背', '肩', '手臂', '腿', '核心', '全身'].map(a => (
                <View key={a} className={`meal-type-tag ${qForm.targetAreas.includes(a) ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, targetAreas: toggleArrayItem(qForm.targetAreas, a)})}>
                  <Text className={qForm.targetAreas.includes(a) ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>训练经验水平？</Text>
            <View className='tag-row'>
              {[{k:'beginner',v:'新手'},{k:'intermediate',v:'有一定基础'},{k:'advanced',v:'进阶'}].map(o => (
                <View key={o.k} className={`meal-type-tag ${qForm.experience === o.k ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, experience: o.k})}>
                  <Text className={qForm.experience === o.k ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{o.v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>训练场所？</Text>
            <View className='tag-row'>
              {[{k:'home',v:'居家'},{k:'gym',v:'健身房'},{k:'anywhere',v:'都可以'}].map(o => (
                <View key={o.k} className={`meal-type-tag ${qForm.location === o.k ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, location: o.k})}>
                  <Text className={qForm.location === o.k ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{o.v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>可用器械？（多选）</Text>
            <View className='tag-row'>
              {['无器械', '哑铃', '杠铃', '弹力带', '综合器械'].map(e =>
                <View key={e} className={`meal-type-tag ${qForm.equipment.includes(e) ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, equipment: toggleArrayItem(qForm.equipment, e)})}>
                  <Text className={qForm.equipment.includes(e) ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{e}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ marginBottom: '14rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '6rpx', display: 'block' }}>能接受的动作强度？</Text>
            <View className='tag-row'>
              {[{k:'low',v:'温和'},{k:'medium',v:'中等'},{k:'high',v:'高强度'}].map(o => (
                <View key={o.k} className={`meal-type-tag ${qForm.intensity === o.k ? 'meal-type-tag--active' : ''}`} onClick={() => setQForm({...qForm, intensity: o.k})}>
                  <Text className={qForm.intensity === o.k ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{o.v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ display: 'flex', gap: '8px' }}>
            <View style={{ flex: 1, padding: '16rpx', borderRadius: '12rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }} onClick={() => setShowQuestionnaire(false)}>
              <Text style={{ fontSize: '26rpx', color: '#1f2937' }}>取消</Text>
            </View>
            <View style={{ flex: 1, padding: '16rpx', borderRadius: '12rpx', textAlign: 'center', background: '#07c160' }} onClick={submitQuestionnaire}>
              <Text style={{ fontSize: '26rpx', color: '#ffffff' }}>开始生成</Text>
            </View>
          </View>
        </View>
      )}

      {plan && (
        <>
          <View className='card'>
            <Text className='card__title'>{plan.title}</Text>
            <Text className='card__text'>
              {plan.goalType === 'fat_loss' ? '减脂' : plan.goalType === 'muscle_gain' ? '增肌' : '维持'}
              {' · '}{plan.frequencyPerWeek} 次/周 · {plan.durationMinutes} 分钟/次
            </Text>
          </View>

          {/* Today's training highlight */}
          <View className='card' style={{ background: todayTraining ? 'linear-gradient(135deg, #e8f8ef, #f0faf4)' : '#fef9f0', border: todayTraining ? '1px solid #d4f0df' : '1px solid #fde8c8' }}>
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
                <Text className='card__text' style={{ fontWeight: '500', color: '#38384d', marginBottom: '4rpx' }}>
                  {todayTraining.focus} · {todayTraining.durationMinutes} 分钟
                </Text>
                {Array.isArray(todayTraining.exercises) && todayTraining.exercises.map((ex: string, j: number) => {
                  const done = completedToday.includes(ex)
                  return (
                    <View key={j} style={{ display: 'flex', alignItems: 'center', paddingTop: '4px', paddingBottom: '4px' }}>
                      <View
                        onClick={() => toggleExercise(ex)}
                        style={{
                          width: '22px', height: '22px', minWidth: '22px', borderRadius: '4px',
                          border: done ? 'none' : '2px solid #d1d5db',
                          background: done ? '#07c160' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginRight: '8px',
                        }}
                      >
                        {done && <Text style={{ color: '#fff', fontSize: '14px', fontWeight: '700', lineHeight: '22px' }}>✓</Text>}
                      </View>
                      <Text style={{ fontSize: '24rpx', color: done ? '#8e8ea0' : '#1a1a2e', textDecoration: done ? 'line-through' : 'none', flex: '1' }}>
                        {ex}
                      </Text>
                    </View>
                  )
                })}
              </>
            ) : (
              <Text className='card__text' style={{ color: '#8e8ea0' }}>今天没有训练安排，好好休息恢复吧</Text>
            )}
          </View>

          {/* Weekly schedule toggle */}
          <View
            className='card card--compact'
            style={{ textAlign: 'center' }}
            onClick={() => setShowFullWeek(!showFullWeek)}
          >
            <Text className='card__action' style={{ fontWeight: '600' }}>
              {showFullWeek ? '收起本周安排 ▲' : '展开本周安排 ▼'}
            </Text>
          </View>

          {showFullWeek && (plan.planContent.weeklySchedule ?? []).map((day: any, i: number) => {
            const isToday = day.dayLabel === todayLabel()
            return (
              <View key={i} className='card card--compact' style={{ borderLeft: isToday ? '6rpx solid #07c160' : undefined }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text className='card__title' style={{ fontSize: '28rpx' }}>{day.dayLabel} · {day.focus}</Text>
                  {isToday && <Text style={{ fontSize: '20rpx', color: '#07c160', fontWeight: '600' }}>今天</Text>}
                </View>
                <Text className='card__text'>
                  {Array.isArray(day.exercises) ? day.exercises.join(' / ') : ''} · {day.durationMinutes} 分钟
                </Text>
              </View>
            )
          })}
        </>
      )}

      {/* Show diet plan even without training plan */}
      {dietAdvice && (
        <View className='card' style={{ borderLeft: '6rpx solid #07c160' }}>
          <Text className='card__title' style={{ marginBottom: '12rpx' }}>饮食建议</Text>
          <View style={{ marginBottom: '12rpx' }}>
            <Text className='card__text' style={{ marginBottom: '4rpx' }}>
              每日目标：{dietAdvice.dailyCalories} kcal
              {dietAdvice.macros && ` · 蛋白质 ${dietAdvice.macros.protein}g · 脂肪 ${dietAdvice.macros.fat}g · 碳水 ${dietAdvice.macros.carbs}g`}
            </Text>
            {dietAdvice.principles.length > 0 && (
              <Text className='card__text'>原则：{dietAdvice.principles.join('；')}</Text>
            )}
          </View>
          {dietAdvice.mealSuggestions.map((meal, i) => (
            <View key={i} style={{ marginBottom: '10rpx' }}>
              <Text className='food-item__name'>{meal.meal}</Text>
              {meal.items.map((item, j) => (
                <Text key={j} className='food-item__calories'>
                  {item.name} {item.grams}g · {item.calories}kcal
                  {item.protein !== undefined && ` · 蛋白${item.protein}g · 脂肪${item.fat}g · 碳水${item.carbs}g`}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {!showCheckin && (
        <View
          style={{ padding: '10px', borderRadius: '8px', textAlign: 'center', background: '#07c160', marginTop: '20px', marginBottom: '16px' }}
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
