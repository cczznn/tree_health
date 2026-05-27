import { View, Text } from '@tarojs/components'

const TAB_LABELS = {
  home: '首页',
  diet: '饮食',
  plan: '计划',
  body: '身体',
  me: '我的',
} as const

type TabKey = keyof typeof TAB_LABELS

interface TabBarProps {
  activeTab: TabKey
  tabs: readonly TabKey[]
  onChange: (tab: TabKey) => void
}

export function TabBar({ activeTab, tabs, onChange }: TabBarProps) {
  return (
    <View className='tab-bar'>
      {tabs.map((tab) => (
        <View
          key={tab}
          className={`tab-item ${activeTab === tab ? 'tab-item--active' : ''}`}
          onClick={() => onChange(tab)}
        >
          <Text className='tab-item__label'>{TAB_LABELS[tab]}</Text>
        </View>
      ))}
    </View>
  )
}
