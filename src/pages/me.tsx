import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { getStoredUser, clearStoredUser, setStoredUser, getUserId, type AuthUser } from '../lib/auth-store'

type GoalType = 'fat_loss' | 'maintain' | 'muscle_gain'
const GOAL_LABELS: Record<GoalType, string> = { fat_loss: '减脂', maintain: '维持', muscle_gain: '增肌' }
const GOAL_TYPES: GoalType[] = ['fat_loss', 'maintain', 'muscle_gain']

function MePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('maintain')
  const [error, setError] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState<GoalType>('maintain')

  useEffect(() => { setUser(getStoredUser()) }, [])

  const handleLogin = () => {
    if (!name || !password) { setError('请输入用户名和密码'); return }
    fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? '登录失败')
        setStoredUser(body.data)
        setUser(body.data)
        setShowLogin(false)
        setName(''); setPassword(''); setError('')
      })
      .catch((err: Error) => setError(err.message))
  }

  const handleRegister = () => {
    if (!name || !password) { setError('请输入用户名和密码'); return }
    if (password.length < 4) { setError('密码至少 4 位'); return }
    fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, goalType }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? '注册失败')
        setStoredUser(body.data)
        setUser(body.data)
        setShowRegister(false)
        setName(''); setPassword(''); setError('')
      })
      .catch((err: Error) => setError(err.message))
  }

  const logout = () => { clearStoredUser(); setUser(null) }

  const updateGoalType = () => {
    fetch('/api/auth/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
      body: JSON.stringify({ goalType: newGoal }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? '修改失败')
        setStoredUser(body.data)
        setUser(body.data)
        setEditingGoal(false)
        setError('')
      })
      .catch((err: Error) => setError(err.message))
  }

  const startEditGoal = () => {
    setNewGoal((user?.goalType as GoalType) ?? 'maintain')
    setEditingGoal(true)
    setError('')
  }

  // Login form
  if (showLogin) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>登录</Text>
        </View>
        <View className='card'>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>用户名</Text>
            <Input className='search-input' type='text' placeholder='输入用户名' value={name} onInput={(e) => setName(e.detail.value)} />
          </View>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>密码</Text>
            <Input className='search-input' type='text' password placeholder='输入密码' value={password} onInput={(e) => setPassword(e.detail.value)} />
          </View>
          {error && <Text style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx', marginBottom: '16rpx' }}>{error}</Text>}
          <View style={{ display: 'flex' }}>
            <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb', marginRight: '16rpx' }} onClick={() => { setShowLogin(false); setError('') }}>
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>返回</Text>
            </View>
            <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }} onClick={handleLogin}>
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>登录</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Register form
  if (showRegister) {
    return (
      <View className='page'>
        <View className='page-header'>
          <Text className='page-title'>注册</Text>
        </View>
        <View className='card'>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>用户名</Text>
            <Input className='search-input' type='text' placeholder='输入用户名' value={name} onInput={(e) => setName(e.detail.value)} />
          </View>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>密码</Text>
            <Input className='search-input' type='text' password placeholder='输入密码' value={password} onInput={(e) => setPassword(e.detail.value)} />
          </View>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>目标</Text>
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
          {error && <Text style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx', marginBottom: '16rpx' }}>{error}</Text>}
          <View style={{ display: 'flex' }}>
            <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb', marginRight: '16rpx' }} onClick={() => { setShowRegister(false); setError('') }}>
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>返回</Text>
            </View>
            <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }} onClick={handleRegister}>
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>注册</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Not logged in
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
          <View style={{ display: 'flex' }}>
            <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160', marginRight: '12rpx' }} onClick={() => setShowLogin(true)}>
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>登录</Text>
            </View>
            <View style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }} onClick={() => setShowRegister(true)}>
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>注册</Text>
            </View>
          </View>
        </View>
        <View className='card'>
          <Text className='card__title'>游客模式</Text>
          <Text className='card__text'>未登录状态下使用 demo 账号体验功能</Text>
        </View>
      </View>
    )
  }

  // Logged in
  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>我的</Text>
        <Text className='page-subtitle'>账号、目标、设置</Text>
      </View>
      <View className='card'>
        <Text className='card__title' style={{ marginBottom: '12rpx' }}>个人信息</Text>
        <Text className='card__text' style={{ marginBottom: '8rpx' }}>用户名：{user.name}</Text>
        {!editingGoal ? (
          <View className='food-item' style={{ padding: '8rpx 0' }}>
            <Text className='card__text'>目标类型：{GOAL_LABELS[user.goalType as GoalType] ?? '维持'}</Text>
            <Text className='card__action' onClick={startEditGoal}>修改</Text>
          </View>
        ) : (
          <View style={{ marginTop: '8rpx' }}>
            <View className='tag-row' style={{ marginBottom: '12rpx' }}>
              {GOAL_TYPES.map((t) => {
                const active = newGoal === t
                return (
                  <View key={t} className={`meal-type-tag ${active ? 'meal-type-tag--active' : ''}`} onClick={() => setNewGoal(t)}>
                    <Text className={active ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{GOAL_LABELS[t]}</Text>
                  </View>
                )
              })}
            </View>
            {error && <Text style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx', marginBottom: '8rpx' }}>{error}</Text>}
            <View style={{ display: 'flex' }}>
              <View style={{ flex: 1, padding: '14rpx', borderRadius: '12rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb', marginRight: '12rpx' }} onClick={() => { setEditingGoal(false); setError('') }}>
                <Text style={{ fontSize: '26rpx', color: '#1f2937' }}>取消</Text>
              </View>
              <View style={{ flex: 1, padding: '14rpx', borderRadius: '12rpx', textAlign: 'center', background: '#07c160' }} onClick={updateGoalType}>
                <Text style={{ fontSize: '26rpx', color: '#ffffff' }}>保存目标</Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <View className='card'>
        <Text className='card__title'>关于</Text>
        <Text className='card__text'>健康管理小程序 v0.2.0</Text>
        <Text className='card__text'>AI4SE 期末项目</Text>
      </View>
      <View style={{ marginTop: '20rpx' }}>
        <View style={{ padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }} onClick={logout}>
          <Text style={{ fontSize: '28rpx', color: '#e74c3c', fontWeight: '500' }}>退出登录</Text>
        </View>
      </View>
    </View>
  )
}

export default MePage
