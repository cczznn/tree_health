import type { DailyMealSummary, Food, MealRecord, WorkoutPlan, WorkoutCheckin, BodyMetric } from '../domain/types';
import { NotFoundError } from '../domain/errors';
import { PRESET_FOODS } from '../foods/preset-foods';

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  getById(id: string): Promise<T>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export class InMemoryRepository<T extends { id: string }> implements IRepository<T> {
  protected store = new Map<string, T>();

  constructor(private readonly entityName = 'Entity') {}

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async getById(id: string): Promise<T> {
    const entity = this.store.get(id);
    if (!entity) throw new NotFoundError(this.entityName, id);
    return entity;
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    const all = Array.from(this.store.values());
    if (!filter) return all;
    return all.filter((item) =>
      Object.entries(filter).every(([key, value]) => item[key as keyof T] === value),
    );
  }

  async create(entity: T): Promise<T> {
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const existing = await this.getById(id);
    const updated = { ...existing, ...data, id };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.store.has(id)) throw new NotFoundError(this.entityName, id);
    this.store.delete(id);
  }
}

export class FoodRepository extends InMemoryRepository<Food> {
  constructor() {
    super('Food');
    this.seedPresetFoods();
  }

  private seedPresetFoods() {
    PRESET_FOODS.forEach((food, index) => {
      const id = `preset-${index + 1}`;
      this.store.set(id, {
        id,
        createdAt: '2026-05-23T00:00:00.000Z',
        ...food,
      });
    });
  }

  async search(query: string, userId?: string): Promise<Food[]> {
    const keyword = query.toLowerCase().trim();
    return Array.from(this.store.values()).filter((food) => {
      const visible = food.sourceType === 'preset' || food.userId === userId;
      const nameMatch = keyword === '' || food.name.toLowerCase().includes(keyword);
      return visible && nameMatch;
    });
  }

  async countCustomByUser(userId: string): Promise<number> {
    return Array.from(this.store.values()).filter(
      (f) => f.sourceType === 'custom' && f.userId === userId,
    ).length;
  }

  async findCustomByUser(userId: string): Promise<Food[]> {
    return Array.from(this.store.values()).filter(
      (f) => f.sourceType === 'custom' && f.userId === userId,
    );
  }
}

export class MealRecordRepository extends InMemoryRepository<MealRecord> {
  async findByUserAndDate(userId: string, date: string): Promise<MealRecord[]> {
    return Array.from(this.store.values()).filter(
      (record) => record.userId === userId && record.recordDate === date,
    );
  }
}

export class DailyMealSummaryRepository extends InMemoryRepository<DailyMealSummary> {
  async findByUserAndDate(userId: string, date: string): Promise<DailyMealSummary | null> {
    return Array.from(this.store.values()).find(
      (summary) => summary.userId === userId && summary.summaryDate === date,
    ) ?? null;
  }
}

export class WorkoutPlanRepository extends InMemoryRepository<WorkoutPlan> {}

export class WorkoutCheckinRepository extends InMemoryRepository<WorkoutCheckin> {
  async findByUserPlanAndDate(userId: string, planId: string, date: string): Promise<WorkoutCheckin[]> {
    return Array.from(this.store.values()).filter(
      (checkin) => checkin.userId === userId && checkin.planId === planId && checkin.date === date,
    );
  }
}

export class BodyMetricRepository extends InMemoryRepository<BodyMetric> {
  async findByUser(userId: string): Promise<BodyMetric[]> {
    return Array.from(this.store.values()).filter((metric) => metric.userId === userId);
  }

  async findByUserAndDateRange(userId: string, startDate: string, endDate: string): Promise<BodyMetric[]> {
    return Array.from(this.store.values()).filter(
      (metric) => metric.userId === userId && metric.metricDate >= startDate && metric.metricDate <= endDate,
    );
  }
}
