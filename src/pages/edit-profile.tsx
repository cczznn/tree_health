import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getStoredUser, setStoredUser, getUserId, type AuthUser } from '../lib/auth-store'

type GoalType = 'fat_loss' | 'maintain' | 'muscle_gain'
const GOAL_LABELS: Record<GoalType, string> = { fat_loss: '减脂', maintain: '维持', muscle_gain: '增肌' }
const GOAL_TYPES: GoalType[] = ['fat_loss', 'maintain', 'muscle_gain']

function EditProfilePage() {
  const user = getStoredUser()
  const [age, setAge] = useState(user?.age ? String(user.age) : '')
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : '')
  const [height, setHeight] = useState(user?.height ? String(user.height) : '')
  const [gender, setGender] = useState<'male' | 'female' | null>(user?.gender ?? null)
  const [goalType, setGoalType] = useState<GoalType>((user?.goalType as GoalType) ?? 'maintain')
  const [error, setError] = useState('')

  const saveAll = () => {
    const ageVal = age ? parseInt(age, 10) : null
    if (ageVal !== null && (ageVal < 10 || ageVal > 120)) { setError('年龄需在 10-120 之间'); return }
    const weightVal = weight ? parseFloat(weight) : null
    const heightVal = height ? parseFloat(height) : null

    const userId = getUserId()
    const profileBody = JSON.stringify({ age: ageVal, gender, weight: weightVal, height: heightVal })

    fetch('/api/auth/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: profileBody,
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? '保存失败')
        return fetch('/api/auth/goal', {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ goalType }),
        }).then(async (res2) => {
          const body2 = await res2.json()
          if (!res2.ok) throw new Error(body2.error?.message ?? '保存失败')
          setStoredUser(body2.data)
          Taro.navigateBack()
        })
      })
      .catch((err: Error) => setError(err.message))
  }

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>编辑个人信息</Text>
      </View>

      <View className='card'>
        <Text className='card__title' style={{ marginBottom: '16rpx' }}>基础信息</Text>

        <View style={{ marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>性别</Text>
          <View style={{ display: 'flex', gap: '8px' }}>
            <View style={{ flex: 1, padding: '14rpx', borderRadius: '10rpx', textAlign: 'center', border: '2rpx solid #07c160', background: gender === 'male' ? '#07c160' : '#fff' }} onClick={() => setGender('male')}>
              <Text style={{ fontSize: '26rpx', color: gender === 'male' ? '#fff' : '#07c160' }}>男</Text>
            </View>
            <View style={{ flex: 1, padding: '14rpx', borderRadius: '10rpx', textAlign: 'center', border: '2rpx solid #07c160', background: gender === 'female' ? '#07c160' : '#fff' }} onClick={() => setGender('female')}>
              <Text style={{ fontSize: '26rpx', color: gender === 'female' ? '#fff' : '#07c160' }}>女</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>年龄</Text>
          <Input className='search-input' type='digit' placeholder='10-120' value={age} onInput={(e) => setAge(e.detail.value)} />
        </View>

        <View style={{ display: 'flex', gap: '6px', marginBottom: '16rpx' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>体重 kg（选填）</Text>
            <Input className='search-input' type='digit' placeholder='如 70' value={weight} onInput={(e) => setWeight(e.detail.value)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>身高 cm（选填）</Text>
            <Input className='search-input' type='digit' placeholder='如 172' value={height} onInput={(e) => setHeight(e.detail.value)} />
          </View>
        </View>
      </View>

      <View className='card'>
        <Text className='card__title' style={{ marginBottom: '16rpx' }}>健身目标</Text>
        <View className='tag-row'>
          {GOAL_TYPES.map((t) => {
            const active = goalType === t
            return (
              <View key={t} className={`meal-type-tag ${active ? 'meal-type-tag--active' : ''}`} onClick={() => setGoalType(t)}>
                <Text className={active ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{GOAL_LABELS[t]}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {error && <Text style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx', marginBottom: '12rpx' }}>{error}</Text>}

      <View style={{ display: 'flex', gap: '8px' }}>
        <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }} onClick={() => Taro.navigateBack()}>
          <Text style={{ fontSize: '28rpx', color: '#1f2937' }}>取消</Text>
        </View>
        <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }} onClick={saveAll}>
          <Text style={{ fontSize: '28rpx', color: '#ffffff' }}>保存</Text>
        </View>
      </View>
    </View>
  )
}

export default EditProfilePage
