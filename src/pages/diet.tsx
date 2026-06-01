import { useEffect, useState, useMemo } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { getMealRecords, searchFoods, addMealRecord, addCustomFood, updateCustomFood, deleteCustomFood } from '../lib/api'
import { buildDietDisplay } from '../lib/page-data'
import { filterFoods, formatCalories, formatNutrients, groupFoodsByLetter, type FoodItem } from '../lib/food-search'
import { validateMealForm, getMealTypeLabel, MEAL_TYPES, type MealType, type MealFormInput } from '../lib/meal-form'
import { requireLogin } from '../lib/auth-store'

function DietPage() {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [allFoods, setAllFoods] = useState<FoodItem[]>([])
  const [apiMeals, setApiMeals] = useState<{ count: number; calories: number; protein: number; fat: number; carbs: number; fiber: number } | null>(null)
  const [foodsTotal, setFoodsTotal] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [mealRecords, setMealRecords] = useState<Array<{ id: string; foodId: string; mealType: string; amount: number; calories: number; protein: number; fat: number; carbs: number; fiber: number; recordDate: string; note: string | null }>>([])
  const [showRecords, setShowRecords] = useState(false)

  const [showCustomForm, setShowCustomForm] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)
  const [customName, setCustomName] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customFat, setCustomFat] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFiber, setCustomFiber] = useState('')
  const [customSugar, setCustomSugar] = useState('')
  const [customSodium, setCustomSodium] = useState('')
  const [customFormErrors, setCustomFormErrors] = useState<string[]>([])

  useEffect(() => {
    const date = currentDate()
    Promise.all([getMealRecords(date), searchFoods('')])
      .then(([records, foods]) => {
        setApiMeals({
          count: records.summary.mealCount,
          calories: records.summary.totalCalories,
          protein: records.summary.totalProtein,
          fat: records.summary.totalFat,
          carbs: records.summary.totalCarbs,
          fiber: records.summary.totalFiber,
        })
        setFoodsTotal(foods.total)
        setAllFoods(foods.data)
        setMealRecords(records.data)
      })
      .catch((err: Error) => {
        setLoadError(err.message)
      })
  }, [])

  const displayData = useMemo(() => {
    if (loadError) return buildDietDisplay(null, null, loadError)
    if (!apiMeals || foodsTotal === null) {
      return { recordSummary: '加载中', foodSummary: '加载中', loading: true, error: null }
    }
    return buildDietDisplay(
      { summary: { mealCount: apiMeals.count, totalCalories: apiMeals.calories, totalProtein: apiMeals.protein, totalFat: apiMeals.fat, totalCarbs: apiMeals.carbs, totalFiber: apiMeals.fiber } },
      foodsTotal,
    )
  }, [apiMeals, foodsTotal, loadError])

  const filtered = useMemo(() => filterFoods(allFoods, query), [allFoods, query])
  const foodGroups = useMemo(() => groupFoodsByLetter(allFoods), [allFoods])

  const selectFood = (food: FoodItem) => {
    setSelectedFood(food)
    setQuery('')
    setAmount('1')
    setMealType('breakfast')
    setFormErrors([])
  }

  const submitMeal = () => {
    if (!requireLogin()) return
    const input: Partial<MealFormInput> = {
      foodId: selectedFood?.id,
      foodName: selectedFood?.name,
      amount: parseFloat(amount),
      mealType,
    }
    const errors = validateMealForm(input)
    if (errors.length > 0) {
      setFormErrors(errors.map((e) => e.message))
      return
    }
    if (!selectedFood) return

    addMealRecord({
      foodId: selectedFood.id,
      mealType,
      amount: parseFloat(amount),
      unit: '份',
      recordDate: currentDate(),
      note: null,
    })
      .then(() => getMealRecords(currentDate()))
      .then((records) => {
        setApiMeals({
          count: records.summary.mealCount,
          calories: records.summary.totalCalories,
          protein: records.summary.totalProtein,
          fat: records.summary.totalFat,
          carbs: records.summary.totalCarbs,
          fiber: records.summary.totalFiber,
        })
        setMealRecords(records.data)
        setSelectedFood(null)
        setFormErrors([])
      })
      .catch((err: Error) => {
        setFormErrors([err.message])
      })
  }

  const clearCustomForm = () => {
    setShowCustomForm(false)
    setEditingFood(null)
    setCustomName(''); setCustomCalories(''); setCustomProtein(''); setCustomFat('')
    setCustomCarbs(''); setCustomFiber(''); setCustomSugar(''); setCustomSodium('')
    setCustomFormErrors([])
  }

  const startEditFood = (food: FoodItem) => {
    setEditingFood(food)
    setCustomName(food.name)
    setCustomCalories(String(food.caloriesPer100g))
    setCustomProtein(String(food.proteinPer100g))
    setCustomFat(String(food.fatPer100g))
    setCustomCarbs(String(food.carbsPer100g))
    setCustomFiber(food.fiberPer100g !== null ? String(food.fiberPer100g) : '')
    setCustomSugar(food.sugarPer100g !== null ? String(food.sugarPer100g) : '')
    setCustomSodium(food.sodiumPer100g !== null ? String(food.sodiumPer100g) : '')
    setCustomFormErrors([])
  }

  const submitCustomFood = () => {
    if (!requireLogin()) return
    const errors: string[] = []
    if (!customName.trim()) errors.push('请输入食物名称')
    if (!customCalories || parseFloat(customCalories) <= 0) errors.push('请输入有效的卡路里')
    if (!customProtein || parseFloat(customProtein) < 0) errors.push('请输入有效的蛋白质')
    if (!customFat || parseFloat(customFat) < 0) errors.push('请输入有效的脂肪')
    if (!customCarbs || parseFloat(customCarbs) < 0) errors.push('请输入有效的碳水')
    if (errors.length > 0) { setCustomFormErrors(errors); return }

    const input = {
      name: customName.trim(),
      caloriesPer100g: parseFloat(customCalories),
      proteinPer100g: parseFloat(customProtein),
      fatPer100g: parseFloat(customFat),
      carbsPer100g: parseFloat(customCarbs),
      fiberPer100g: customFiber ? parseFloat(customFiber) : null,
      sugarPer100g: customSugar ? parseFloat(customSugar) : null,
      sodiumPer100g: customSodium ? parseFloat(customSodium) : null,
    }
    const action = editingFood ? updateCustomFood(editingFood.id, input) : addCustomFood(input)
    action
      .then(() => searchFoods(''))
      .then((foods) => {
        setAllFoods(foods.data)
        setFoodsTotal(foods.total)
        clearCustomForm()
      })
      .catch((err: Error) => setCustomFormErrors([err.message]))
  }

  const handleDeleteFood = (food: FoodItem) => {
    if (!requireLogin()) return
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm(`确定要删除「${food.name}」吗？删除后不可恢复。`)) return
    }
    deleteCustomFood(food.id)
      .then(() => searchFoods(''))
      .then((foods) => {
        setAllFoods(foods.data)
        setFoodsTotal(foods.total)
      })
      .catch((err: Error) => setCustomFormErrors([err.message]))
  }

  const foodActionButtons = (food: FoodItem) => (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12rpx' }}>
      <View className='btn-action' onClick={() => selectFood(food)}>
        <Text>+ 记录</Text>
      </View>
      {food.sourceType === 'custom' && (
        <>
          <View className='btn-action' onClick={() => startEditFood(food)}>
            <Text>编辑</Text>
          </View>
          <View className='btn-action btn-action--danger' onClick={() => handleDeleteFood(food)}>
            <Text>删除</Text>
          </View>
        </>
      )}
    </View>
  )

  const inlineEditCard = (food: FoodItem) => (
    editingFood?.id === food.id && (
      <View style={{ background: '#f9fafb', borderRadius: '16rpx', padding: '20rpx', marginTop: '12rpx', marginBottom: '12rpx', border: '2rpx solid #e5e7eb' }}>
        <View style={{ marginBottom: '10rpx' }}>
          <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>名称 *</Text>
          <Input className='search-input' type='text' value={customName} onInput={(e) => setCustomName(e.detail.value)} />
        </View>
        <View style={{ display: 'flex', gap: '8rpx', marginBottom: '10rpx' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>热量(kcal) *</Text>
            <Input className='search-input' type='digit' value={customCalories} onInput={(e) => setCustomCalories(e.detail.value)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>蛋白质(g) *</Text>
            <Input className='search-input' type='digit' value={customProtein} onInput={(e) => setCustomProtein(e.detail.value)} />
          </View>
        </View>
        <View style={{ display: 'flex', gap: '8rpx', marginBottom: '10rpx' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>脂肪(g) *</Text>
            <Input className='search-input' type='digit' value={customFat} onInput={(e) => setCustomFat(e.detail.value)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>碳水(g) *</Text>
            <Input className='search-input' type='digit' value={customCarbs} onInput={(e) => setCustomCarbs(e.detail.value)} />
          </View>
        </View>
        <View style={{ display: 'flex', gap: '8rpx', marginBottom: '10rpx' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>纤维(g)</Text>
            <Input className='search-input' type='digit' value={customFiber} onInput={(e) => setCustomFiber(e.detail.value)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>糖(g)</Text>
            <Input className='search-input' type='digit' value={customSugar} onInput={(e) => setCustomSugar(e.detail.value)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '4rpx', display: 'block' }}>钠(mg)</Text>
            <Input className='search-input' type='digit' value={customSodium} onInput={(e) => setCustomSodium(e.detail.value)} />
          </View>
        </View>
        {customFormErrors.length > 0 && (
          <View style={{ marginBottom: '10rpx' }}>
            {customFormErrors.map((err, i) => <Text key={i} style={{ color: '#e74c3c', display: 'block', fontSize: '22rpx' }}>{err}</Text>)}
          </View>
        )}
        <View style={{ display: 'flex', gap: '16rpx' }}>
          <View style={{ flex: 1, padding: '16rpx', borderRadius: '12rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb' }} onClick={clearCustomForm}>
            <Text style={{ fontSize: '24rpx', color: '#1f2937' }}>取消</Text>
          </View>
          <View style={{ flex: 1, padding: '16rpx', borderRadius: '12rpx', textAlign: 'center', background: '#07c160' }} onClick={submitCustomFood}>
            <Text style={{ fontSize: '24rpx', color: '#ffffff' }}>保存修改</Text>
          </View>
        </View>
      </View>
    )
  )

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>饮食</Text>
        <Text className='page-subtitle'>搜索、记录、汇总</Text>
      </View>

      <View className='card' onClick={() => setShowRecords(!showRecords)}>
        <View className='card__header'>
          <Text className='card__title'>今日记录</Text>
          <Text className='card__action'>{showRecords ? '收起 ▲' : '展开 ▼'}</Text>
        </View>
        <Text className='card__text'>{displayData.recordSummary}</Text>
        {showRecords && (
          <View style={{ marginTop: '16rpx' }}>
            {mealRecords.length === 0 ? (
              <Text className='card__text' style={{ color: '#9ca3af' }}>暂无记录</Text>
            ) : (
              mealRecords.map((r) => (
                <View key={r.id} className='food-item'>
                  <View>
                    <Text className='food-item__name'>{getMealTypeLabel(r.mealType as MealType)} · {r.amount}g</Text>
                    <Text className='food-item__calories'>
                      {r.calories} kcal · 蛋白质 {r.protein}g · 脂肪 {r.fat}g · 碳水 {r.carbs}g · 纤维 {r.fiber}g
                    </Text>
                    {r.note && <Text className='food-item__calories' style={{ color: '#07c160' }}>{r.note}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {!selectedFood && (
        <View className='card'>
          <Input
            className='search-input'
            type='text'
            placeholder='输入食物名称搜索...'
            value={query}
            onInput={(e) => setQuery(e.detail.value)}
          />
          {query && (
            <Text className='card__text' style={{ marginTop: '12rpx' }}>
              找到 {filtered.length} 条结果
            </Text>
          )}
        </View>
      )}

      {selectedFood ? (
        <View className='card'>
          <Text className='card__title' style={{ marginBottom: '16rpx' }}>
            记录：{selectedFood.name}
          </Text>
          <Text style={{ fontSize: '22rpx', color: '#6b7280', display: 'block', marginBottom: '16rpx' }}>
            {formatNutrients(selectedFood)}
          </Text>

          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>克重（g）</Text>
            <Input
              className='search-input'
              type='digit'
              placeholder='如 1、0.5、2'
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
          </View>

          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>餐次</Text>
            <View className='tag-row'>
              {MEAL_TYPES.map((type) => (
                <View
                  key={type}
                  className={`meal-type-tag ${mealType === type ? 'meal-type-tag--active' : ''}`}
                  onClick={() => setMealType(type)}
                >
                  <Text className={mealType === type ? 'meal-type-tag__text--active' : 'meal-type-tag__text'}>
                    {getMealTypeLabel(type)}
                  </Text>
                </View>
              ))}
            </View>
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
              onClick={() => setSelectedFood(null)}
            >
              <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>取消</Text>
            </View>
            <View
              style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }}
              onClick={submitMeal}
            >
              <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>确认记录</Text>
            </View>
          </View>
        </View>
      ) : query ? (
        <View className='card'>
          {filtered.length === 0 ? (
            <Text className='card__text'>未找到匹配的食物</Text>
          ) : (
            filtered.map((food) => (
              <View key={food.id}>
                <View className='food-item'>
                  <View onClick={() => selectFood(food)} style={{ flex: 1 }}>
                    <Text className='food-item__name'>{food.name}</Text>
                    <Text className='food-item__calories'>{formatCalories(food)}</Text>
                    <Text className='food-item__calories'>{formatNutrients(food)}</Text>
                  </View>
                  {foodActionButtons(food)}
                </View>
                {inlineEditCard(food)}
              </View>
            ))
          )}
        </View>
      ) : (
        <View>
          <View className='card'>
            <Text className='card__title' style={{ marginBottom: '8rpx' }}>食物分类</Text>
            <Text className='card__text'>共 {allFoods.length} 种食物，按拼音首字母分类</Text>
          </View>

          {!showCustomForm && (
            <View className='card' onClick={() => { setEditingFood(null); setShowCustomForm(true) }}>
              <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text className='card__action' style={{ fontSize: '28rpx', fontWeight: '600' }}>+ 添加自定义食物</Text>
              </View>
            </View>
          )}

          {showCustomForm && (
            <View className='card'>
              <Text className='card__title' style={{ marginBottom: '16rpx' }}>添加自定义食物</Text>
              <View style={{ marginBottom: '12rpx' }}>
                <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>名称 *</Text>
                <Input className='search-input' type='text' placeholder='如：牛油果' value={customName} onInput={(e) => setCustomName(e.detail.value)} />
              </View>
              <View style={{ display: 'flex', gap: '12rpx', marginBottom: '12rpx' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>热量(kcal) *</Text>
                  <Input className='search-input' type='digit' placeholder='每100g' value={customCalories} onInput={(e) => setCustomCalories(e.detail.value)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>蛋白质(g) *</Text>
                  <Input className='search-input' type='digit' placeholder='每100g' value={customProtein} onInput={(e) => setCustomProtein(e.detail.value)} />
                </View>
              </View>
              <View style={{ display: 'flex', gap: '12rpx', marginBottom: '12rpx' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>脂肪(g) *</Text>
                  <Input className='search-input' type='digit' placeholder='每100g' value={customFat} onInput={(e) => setCustomFat(e.detail.value)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>碳水(g) *</Text>
                  <Input className='search-input' type='digit' placeholder='每100g' value={customCarbs} onInput={(e) => setCustomCarbs(e.detail.value)} />
                </View>
              </View>
              <View style={{ display: 'flex', gap: '12rpx', marginBottom: '12rpx' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>纤维(g)</Text>
                  <Input className='search-input' type='digit' placeholder='可选' value={customFiber} onInput={(e) => setCustomFiber(e.detail.value)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>糖(g)</Text>
                  <Input className='search-input' type='digit' placeholder='可选' value={customSugar} onInput={(e) => setCustomSugar(e.detail.value)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '24rpx', color: '#6b7280', marginBottom: '8rpx', display: 'block' }}>钠(mg)</Text>
                  <Input className='search-input' type='digit' placeholder='可选' value={customSodium} onInput={(e) => setCustomSodium(e.detail.value)} />
                </View>
              </View>
              {customFormErrors.length > 0 && (
                <View style={{ marginBottom: '12rpx' }}>
                  {customFormErrors.map((err, i) => (
                    <Text key={i} style={{ color: '#e74c3c', display: 'block', fontSize: '24rpx' }}>{err}</Text>
                  ))}
                </View>
              )}
              <View style={{ display: 'flex' }}>
                <View
                  style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#f5f7fb', border: '2rpx solid #e5e7eb', marginRight: '16rpx' }}
                  onClick={clearCustomForm}
                >
                  <Text style={{ fontSize: '28rpx', color: '#1f2937', fontWeight: '500' }}>取消</Text>
                </View>
                <View
                  style={{ flex: 1, padding: '20rpx', borderRadius: '16rpx', textAlign: 'center', background: '#07c160' }}
                  onClick={submitCustomFood}
                >
                  <Text style={{ fontSize: '28rpx', color: '#ffffff', fontWeight: '500' }}>确认添加</Text>
                </View>
              </View>
            </View>
          )}

          {foodGroups.map((group) => (
            <View key={group.letter} className='card'>
              <Text className='card__title' style={{ marginBottom: '12rpx', color: '#07c160' }}>{group.letter}</Text>
              {group.foods.map((food) => (
                <View key={food.id}>
                  <View className='food-item'>
                    <View onClick={() => selectFood(food)} style={{ flex: 1 }}>
                      <Text className='food-item__name'>{food.name}</Text>
                      <Text className='food-item__calories'>{formatCalories(food)}</Text>
                    </View>
                    {foodActionButtons(food)}
                  </View>
                  {inlineEditCard(food)}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

    </View>
  )
}

export default DietPage

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}
