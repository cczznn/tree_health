import { useState } from 'react'
import { View, Text } from '@tarojs/components'

type GoalType = 'fat_loss' | 'maintain' | 'muscle_gain'

const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: '减脂',
  maintain: '维持',
  muscle_gain: '增肌',
}

const GOAL_TYPES: GoalType[] = ['fat_loss', 'maintain', 'muscle_gain']

function MePage() {
  const [goalType, setGoalType] = useState<GoalType>('maintain')

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>我的</Text>
        <Text className='page-subtitle'>账号、目标、设置</Text>
      </View>

      <View className='card'>
        <Text className='card__title'>个人信息</Text>
        <View style={{ marginTop: '12rpx' }}>
          <Text className='card__text' style={{ marginBottom: '8rpx' }}>用户名：demo-user</Text>
          <Text className='card__text' style={{ marginBottom: '8rpx' }}>当前计划：新手入门训练计划</Text>
        </View>
      </View>

      <View className='card'>
        <Text className='card__title'>目标设置</Text>
        <Text className='card__text' style={{ marginBottom: '12rpx' }}>
          当前目标：{GOAL_LABELS[goalType]}
        </Text>
        <View style={{ display: 'flex', flexWrap: 'wrap' }}>
          {GOAL_TYPES.map((type) => {
            const active = goalType === type
            return (
              <View
                key={type}
                style={{
                  padding: '12rpx 32rpx',
                  borderRadius: '16rpx',
                  marginRight: '16rpx',
                  marginBottom: '8rpx',
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
        <Text className='card__text'>健康管理小程序 v0.1.0</Text>
        <Text className='card__text'>AI4SE 期末项目 · T11 前端</Text>
      </View>
    </View>
  )
}

export default MePage
