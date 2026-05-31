import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { getStoredUser, clearStoredUser, type AuthUser } from '../lib/auth-store'

type GoalType = 'fat_loss' | 'maintain' | 'muscle_gain'

const GOAL_LABELS: Record<GoalType, string> = { fat_loss: '减脂', maintain: '维持', muscle_gain: '增肌' }
const GOAL_TYPES: GoalType[] = ['fat_loss', 'maintain', 'muscle_gain']

function MePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [goalType, setGoalType] = useState<GoalType>('maintain')

  useEffect(() => {
    const u = getStoredUser()
    setUser(u)
    if (u) setGoalType(u.goalType as GoalType)
  }, [])

  const logout = () => { clearStoredUser(); setUser(null) }

  // not logged in — show login/register buttons
  if (!user) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>我的</Text>
          <Text className='page-subtitle'>登录后可保存个人数据</Text>
        </View>

        <View className='card'>
          <Text className='card__title' style={{ marginBottom: '12rpx' }}>欢迎使用健康管理</Text>
          <Text className='card__text' style={{ marginBottom: '16rpx' }}>登录后所有数据将按用户隔离保存</Text>
          <View style={{ display: 'flex', marginRight: '-12rpx' }}>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160', marginRight: '12rpx' }}
              onClick={() => window.location.assign('/pages/login/index.html')}
            >
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>登录</Text>
            </View>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }}
              onClick={() => window.location.assign('/pages/register/index.html')}
            >
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>注册</Text>
            </View>
          </View>
        </View>

        <View className='card'>
          <Text className='card__title'>游客模式</Text>
          <Text className='card__text'>未登录状态下使用 demo 账号体验功能，数据不会被保存</Text>
        </View>
      </View>
    )
  }

  // logged in
  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>我的</Text>
        <Text className='page-subtitle'>账号、目标、设置</Text>
      </View>

      <View className='card'>
        <Text className='card__title'>个人信息</Text>
        <View style={{ marginTop: '12rpx' }}>
          <Text className='card__text' style={{ marginBottom: '8rpx' }}>用户名：{user.name}</Text>
          <Text className='card__text' style={{ marginBottom: '8rpx' }}>目标类型：{GOAL_LABELS[goalType]}</Text>
        </View>
      </View>

      <View className='card'>
        <Text className='card__title'>目标设置</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap' }}>
          {GOAL_TYPES.map((type) => {
            const active = goalType === type
            return (
              <View
                key={type}
                style={{
                  padding: '12rpx 32rpx', borderRadius: '16rpx', marginRight: '16rpx', marginBottom: '8rpx',
                  background: active ? '#07c160' : '#ffffff',
                  border: active ? '2rpx solid #07c160' : '2rpx solid #d1d5db',
                }}
                onClick={() => setGoalType(type)}
              >
                <Text style={{ fontSize: '26rpx', color: active ? '#ffffff' : '#374151', fontWeight: active ? '600' : '400' }}>
                  {GOAL_LABELS[type]}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      <View className='card'>
        <Text className='card__title'>关于</Text>
        <Text className='card__text'>健康管理小程序 v0.2.0</Text>
        <Text className='card__text'>AI4SE 期末项目 · 已登录</Text>
      </View>

      <View style={{ marginTop: '20rpx' }}>
        <View
          style={{ padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }}
          onClick={logout}
        >
          <Text style={{ fontSize: '28rpx', color: '#e74c3c', fontWeight: '500' }}>退出登录</Text>
        </View>
      </View>
    </View>
  )
}

export default MePage
