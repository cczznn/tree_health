import { useEffect, useState, useMemo } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { getMealRecords, searchFoods, addMealRecord } from '../lib/api'
import { buildDietDisplay } from '../lib/page-data'
import { filterFoods, formatCalories, formatNutrients, groupFoodsByLetter, type FoodItem } from '../lib/food-search'
import { validateMealForm, getMealTypeLabel, MEAL_TYPES, type MealType, type MealFormInput } from '../lib/meal-form'
import { requireLogin } from '../lib/auth-store'

interface LocalMeal {
  id: string
  foodId: string
  foodName: string
  amount: number
  mealType: MealType
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

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
      .then(() => {
        // Reload data from backend
        return getMealRecords(currentDate())
      })
      .then((records) => {
        setApiMeals({
          count: records.summary.mealCount,
          calories: records.summary.totalCalories,
          protein: records.summary.totalProtein,
          fat: records.summary.totalFat,
          carbs: records.summary.totalCarbs,
          fiber: records.summary.totalFiber,
        })
        setSelectedFood(null)
        setFormErrors([])
      })
      .catch((err: Error) => {
        setFormErrors([err.message])
      })
  }

  return (
    <View className='page'>
      <View className='page-header'>
        <Text className='page-title'>饮食</Text>
        <Text className='page-subtitle'>搜索、记录、汇总</Text>
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
              <View key={food.id} className='food-item' onClick={() => selectFood(food)}>
                <View>
                  <Text className='food-item__name'>{food.name}</Text>
                  <Text className='food-item__calories'>{formatCalories(food)}</Text>
                  <Text className='food-item__calories'>{formatNutrients(food)}</Text>
                </View>
                <Text className='card__action' style={{ fontWeight: '600' }}>+ 记录</Text>
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
          {foodGroups.map((group) => (
            <View key={group.letter} className='card'>
              <Text className='card__title' style={{ marginBottom: '12rpx', color: '#07c160' }}>{group.letter}</Text>
              {group.foods.map((food) => (
                <View key={food.id} className='food-item' onClick={() => selectFood(food)}>
                  <View>
                    <Text className='food-item__name'>{food.name}</Text>
                    <Text className='food-item__calories'>{formatCalories(food)}</Text>
                  </View>
                  <Text className='card__action' style={{ fontWeight: '600' }}>+ 记录</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <View className='card'>
        <Text className='card__title'>今日记录</Text>
        <Text className='card__text'>{displayData.recordSummary}</Text>
      </View>

    </View>
  )
}

export default DietPage

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}
