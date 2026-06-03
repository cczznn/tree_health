import { useEffect, useState, useMemo } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { getBodyMetrics, addBodyMetric } from '../lib/api'
import { validateBodyForm, computeTrend, type BodyMetricEntry } from '../lib/body-data'
import { requireLogin, isLoggedIn } from '../lib/auth-store'

function BodyPage() {
  const [metrics, setMetrics] = useState<BodyMetricEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [waist, setWaist] = useState('')
  const [chest, setChest] = useState('')
  const [hip, setHip] = useState('')
  const [note, setNote] = useState('')
  const [formErrors, setFormErrors] = useState<string[]>([])

  const lastHeight = useMemo(() => {
    for (let i = metrics.length - 1; i >= 0; i--) {
      if (metrics[i].height !== null) return String(metrics[i].height)
    }
    return ''
  }, [metrics])

  useEffect(() => {
    getBodyMetrics()
      .then((res) => { setMetrics(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const trend = useMemo(() => computeTrend(metrics), [metrics])

  const openForm = () => {
    setShowForm(true)
    setHeight(lastHeight)
    setFormErrors([])
  }

  const submitMetric = () => {
    if (!requireLogin()) return
    const errors = validateBodyForm({
      weight: parseFloat(weight),
      height: height ? parseFloat(height) : null,
      waist: waist ? parseFloat(waist) : null,
      chest: chest ? parseFloat(chest) : null,
      hip: hip ? parseFloat(hip) : null,
    })
    if (errors.length > 0) { setFormErrors(errors); return }

    addBodyMetric({
      weight: parseFloat(weight),
      height: height ? parseFloat(height) : null,
      waist: waist ? parseFloat(waist) : null,
      chest: chest ? parseFloat(chest) : null,
      hip: hip ? parseFloat(hip) : null,
      note,
    })
      .then(({ data }) => {
        setMetrics((prev) => [...prev, data])
        setShowForm(false)
        setWeight(''); setHeight(''); setWaist(''); setChest(''); setHip(''); setNote('')
        setFormErrors([])
      })
      .catch(() => setFormErrors(['保存失败，请重试']))
  }

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>身体</Text>
        <Text className='page-subtitle'>体重、围度、趋势</Text>
      </View>

      {!isLoggedIn() ? (
        <View className='card'><Text className='card__text'>请前往"我的"页面登录后查看</Text></View>
      ) : loading ? (
        <View className='card'><Text className='card__text'>加载中...</Text></View>
      ) : (
        <>
          {trend.latest && (
            <View className='card' style={{ background: '#fff' }}>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16rpx' }}>
                <Text className='card__title'>最新记录</Text>
                <Text style={{ fontSize: '22rpx', color: '#8e8ea0' }}>{trend.latest.metricDate}</Text>
              </View>
              <View className='hero-card__stats'>
                <View>
                  <Text className='hero-card__value'>{trend.latest.weight}</Text>
                  <Text className='hero-card__unit'>体重 kg</Text>
                </View>
                <View>
                  <Text className='hero-card__value'>
                    {trend.delta !== 0 ? `${trend.direction}${Math.abs(trend.delta)}` : '—'}
                  </Text>
                  <Text className='hero-card__unit'>较上次</Text>
                </View>
              </View>
              {(trend.latest.height || trend.latest.waist || trend.latest.chest || trend.latest.hip) && (
                <View style={{ marginTop: '20rpx', display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16rpx', background: '#f8f9fa', borderRadius: '12rpx' }}>
                  {trend.latest.height && <Text className='card__text'>身高：{trend.latest.height} cm</Text>}
                  {trend.latest.waist && <Text className='card__text'>腰围：{trend.latest.waist} cm</Text>}
                  {trend.latest.chest && <Text className='card__text'>胸围：{trend.latest.chest} cm</Text>}
                  {trend.latest.hip && <Text className='card__text'>臀围：{trend.latest.hip} cm</Text>}
                </View>
              )}
            </View>
          )}

          <View className='card'>
            <Text className='card__title' style={{ marginBottom: '12rpx' }}>历史记录</Text>
            {metrics.length === 0 ? (
              <Text className='card__text'>暂无记录</Text>
            ) : (
              metrics.slice().reverse().map((m) => (
                <View key={m.id} className='food-item'>
                  <View>
                    <Text className='food-item__name'>{m.metricDate}</Text>
                    <Text className='food-item__calories'>
                      体重 {m.weight} kg
                      {m.height ? ` · 身高 ${m.height} cm` : ''}
                      {m.waist ? ` · 腰围 ${m.waist} cm` : ''}
                      {m.chest ? ` · 胸围 ${m.chest} cm` : ''}
                      {m.hip ? ` · 臀围 ${m.hip} cm` : ''}
                      {m.note ? ` · ${m.note}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {!showForm && (
        <View
          style={{ padding: '10px', borderRadius: '8px', textAlign: 'center', background: '#07c160', marginBottom: '16px' }}
          onClick={openForm}
        >
          <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>+ 添加记录</Text>
        </View>
      )}

      {showForm && (
        <View className='card'>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>体重 (kg) *</Text>
            <Input className='search-input' type='digit' placeholder='如 68.5' value={weight} onInput={(e) => setWeight(e.detail.value)} />
          </View>

          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>身高 (cm) *</Text>
            <Input className='search-input' type='digit' placeholder='如 172' value={height} onInput={(e) => setHeight(e.detail.value)} />
          </View>

          <View style={{ display: 'flex', gap: '6px', marginBottom: '16rpx' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>腰围 cm（选填）</Text>
              <Input className='search-input' type='digit' placeholder='如 78' value={waist} onInput={(e) => setWaist(e.detail.value)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>胸围 cm（选填）</Text>
              <Input className='search-input' type='digit' placeholder='如 92' value={chest} onInput={(e) => setChest(e.detail.value)} />
            </View>
          </View>

          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>臀围 cm（选填）</Text>
            <Input className='search-input' type='digit' placeholder='如 95' value={hip} onInput={(e) => setHip(e.detail.value)} />
          </View>

          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>备注（选填）</Text>
            <Input className='search-input' type='text' placeholder='如：减脂中' value={note} onInput={(e) => setNote(e.detail.value)} />
          </View>

          {formErrors.length > 0 && (
            <View style={{ marginBottom: '16rpx' }}>
              {formErrors.map((err, i) => (
                <Text key={i} style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx' }}>{err}</Text>
              ))}
            </View>
          )}

          <View style={{ display: 'flex' }}>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb', marginRight: '16rpx' }}
              onClick={() => { setShowForm(false); setFormErrors([]) }}
            >
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>取消</Text>
            </View>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }}
              onClick={submitMetric}
            >
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>确认添加</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default BodyPage
