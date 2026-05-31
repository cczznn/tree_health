import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { setStoredUser } from '../lib/auth-store'

type GoalType = 'fat_loss' | 'maintain' | 'muscle_gain'

const GOAL_LABELS: Record<GoalType, string> = { fat_loss: '减脂', maintain: '维持', muscle_gain: '增肌' }
const GOAL_TYPES: GoalType[] = ['fat_loss', 'maintain', 'muscle_gain']

function RegisterPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('maintain')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name || !password) { setError('请输入用户名和密码'); return }
    if (password.length < 4) { setError('密码至少 4 位'); return }

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, goalType }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? '注册失败')
        setStoredUser(body.data)
        window.location.reload()
      })
      .catch((err: Error) => setError(err.message))
  }

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>注册</Text>
        <Text className='page-subtitle'>创建账号，开始健康管理</Text>
      </View>

      <View className='card'>
        <View style={{ marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>用户名</Text>
          <Input className='search-input' type='text' placeholder='输入用户名（至少2字）' value={name} onInput={(e) => setName(e.detail.value)} />
        </View>

        <View style={{ marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>密码</Text>
          <Input className='search-input' type='text' password placeholder='输入密码（至少4位）' value={password} onInput={(e) => setPassword(e.detail.value)} />
        </View>

        <View style={{ marginBottom: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>目标</Text>
          <View className='tag-row'>
            {GOAL_TYPES.map((t) => (
              <View
                key={t}
                className={`meal-type-tag ${goalType === t ? 'meal-type-tag--active' : ''}`}
                onClick={() => setGoalType(t)}
              >
                <Text className={goalType === t ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>{GOAL_LABELS[t]}</Text>
              </View>
            ))}
          </View>
        </View>

        {error && <Text style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx', marginBottom: '16rpx' }}>{error}</Text>}

        <View style={{ padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }} onClick={submit}>
          <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>注册</Text>
        </View>
      </View>
    </View>
  )
}

export default RegisterPage
