import { buildActivityItems, getActivityCompletionRate } from "@/lib/activity";
import type { AppData, CalendarEvent, GrowthRecord, HealthRecord, MealRecord } from "@/lib/types";

export type DailyData = {
  date: string;
  record: GrowthRecord | null;
  meals: MealRecord[];
  healthRecords: HealthRecord[];
  events: CalendarEvent[];
  activityItems: ReturnType<typeof buildActivityItems>;
  activityRate: number;
};

export function getDailyData(data: AppData, date: string): DailyData {
  const meals = data.mealRecords.filter((item) => item.date === date);
  const healthRecords = data.healthRecords.filter((item) => item.date === date);
  const events = data.events.filter((item) => item.date === date);
  const activityItems = buildActivityItems(data.activityRecords, data.profile.dailyGoals, date);

  return {
    date,
    record: data.records.find((item) => item.date === date) ?? null,
    meals,
    healthRecords,
    events,
    activityItems,
    activityRate: getActivityCompletionRate(activityItems)
  };
}

export function buildMonthlyTimeline(data: AppData, month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const prefix = `${year}-${`${monthIndex + 1}`.padStart(2, "0")}`;
  const dateSet = new Set<string>();

  data.records.forEach((item) => item.date.startsWith(prefix) && dateSet.add(item.date));
  data.mealRecords.forEach((item) => item.date.startsWith(prefix) && dateSet.add(item.date));
  data.healthRecords.forEach((item) => item.date.startsWith(prefix) && dateSet.add(item.date));
  data.events.forEach((item) => item.date.startsWith(prefix) && dateSet.add(item.date));
  data.activityRecords.forEach((item) => item.date.startsWith(prefix) && dateSet.add(item.date));

  return [...dateSet].sort((a, b) => b.localeCompare(a)).map((date) => getDailyData(data, date));
}

export function hasAnyDailyContent(daily: DailyData) {
  return Boolean(
    daily.record ||
      daily.meals.length ||
      daily.healthRecords.length ||
      daily.events.length ||
      daily.activityItems.some((item) => item.current > 0)
  );
}
