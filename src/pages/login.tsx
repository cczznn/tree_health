import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { setStoredUser } from '../lib/auth-store'

function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name || !password) { setError('请输入用户名和密码'); return }
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error?.message ?? '登录失败')
        setStoredUser(body.data)
        window.location.reload()
      })
      .catch((err: Error) => setError(err.message))
  }

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>登录</Text>
        <Text className='page-subtitle'>健康管理，从登录开始</Text>
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

        <View style={{ padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }} onClick={submit}>
          <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>登录</Text>
        </View>
      </View>
    </View>
  )
}

export default LoginPage
