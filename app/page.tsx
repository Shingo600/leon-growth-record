"use client";

import Link from "next/link";
import { ActivitySummaryCard } from "@/components/activity-summary-card";
import { BalanceInsightCard } from "@/components/balance-insight-card";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { ExpenseSummaryCard } from "@/components/expense-summary-card";
import { MealSummaryCard } from "@/components/meal-summary-card";
import { QuickAddActions } from "@/components/quick-add-actions";
import { TodayTasksCard } from "@/components/today-tasks-card";
import { WeightChart } from "@/components/weight-chart";
import { useAppData } from "@/components/app-provider";
import { getAgeText, getTodayDateString, getUpcomingEvents } from "@/lib/utils";

export default function HomePage() {
  const { data } = useAppData();
  const today = getTodayDateString();
  const upcomingEvents = getUpcomingEvents(data.events).slice(0, 3);
  const todayActivity = data.activityRecords.filter((item) => item.date === today);
  const walkMinutes = todayActivity
    .filter((item) => item.category === "散歩")
    .reduce((sum, item) => sum + item.durationMinutes, 0);
  const intelligenceMinutes = todayActivity
    .filter((item) => item.category === "知育遊び")
    .reduce((sum, item) => sum + item.durationMinutes, 0);
  const trainingMinutes = todayActivity
    .filter((item) => item.category === "トレーニング")
    .reduce((sum, item) => sum + item.durationMinutes, 0);
  const mealsToday = data.mealRecords.filter((item) => item.date === today);
  const hasWeightToday = data.records.some((item) => item.date === today);
  const todayRecord = data.records.find((item) => item.date === today);
  const todayRecordHref = todayRecord ? `/records/${todayRecord.id}/edit` : "/records/new";

  const tasks = [
    { label: "散歩", remaining: Math.max(data.profile.dailyGoals.walkMinutes - walkMinutes, 0) },
    { label: "知育遊び", remaining: Math.max(data.profile.dailyGoals.intelligenceMinutes - intelligenceMinutes, 0) },
    { label: "トレーニング", remaining: Math.max(data.profile.dailyGoals.trainingMinutes - trainingMinutes, 0) }
  ].filter((item) => item.remaining > 0);

  const completedCount = 3 - tasks.length;
  const dynamicMessage =
    completedCount === 3
      ? "今日は目標を全部達成です。この調子でやさしく見守ろう。"
      : completedCount === 2
        ? "あとひとつで今日の活動バランスが整います。"
        : completedCount === 1
          ? "少しずつ進んでいます。ホームのボタンで気軽に足していけます。"
          : "今日はここからスタート。まずは短めに記録して流れを作りましょう。";

  const balanceItems = [
    { label: "身体活動", value: `${Math.min(Math.round((walkMinutes / data.profile.dailyGoals.walkMinutes) * 100), 100)}%` },
    { label: "知的刺激", value: `${Math.min(Math.round((intelligenceMinutes / data.profile.dailyGoals.intelligenceMinutes) * 100), 100)}%` },
    { label: "食事記録", value: mealsToday.length > 0 ? "100%" : "0%" },
    { label: "体重記録", value: hasWeightToday ? "入力済み" : "未入力" }
  ];

  const balanceComment =
    tasks.length === 0
      ? "今日は活動目標をしっかり達成できています。夜はゆっくり過ごせそうです。"
      : `いま優先したいのは ${tasks[0].label} です。あと ${tasks[0].remaining}分 で今日の目標です。`;

  return (
    <div className="space-y-5">
      <section className="card flex items-center gap-4 p-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-cream">
          <img src={data.profile.photoUrl || "/placeholder-dog.svg"} alt={`${data.profile.name}の写真`} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink/60">毎日ひと目でわかる育成ダッシュボード</p>
          <h2 className="mt-1 text-3xl font-semibold">{data.profile.name}</h2>
          <p className="mt-1 text-sm text-ink/70">{data.profile.breed} / {getAgeText(data.profile.birthday)}</p>
          <p className="mt-3 rounded-3xl bg-cream px-4 py-3 text-sm leading-6 text-ink/75">{dynamicMessage}</p>
        </div>
      </section>

      <ActivitySummaryCard activityRecords={data.activityRecords} goals={data.profile.dailyGoals} today={today} />
      <TodayTasksCard tasks={tasks} />
      <QuickAddActions foodItems={data.foodItems} todayRecordHref={todayRecordHref} />
      <MealSummaryCard mealRecords={data.mealRecords} foodItems={data.foodItems} today={today} />
      <BalanceInsightCard items={balanceItems} comment={balanceComment} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">今日からの予定</h3>
          <Link href={todayRecordHref} className="button-secondary px-4 py-2 text-sm">
            今日の記録を追加
          </Link>
        </div>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <EmptyState title="予定はまだありません" description="散歩や病院の予定を登録しておくと見返しやすくなります。" />
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">体重推移</h3>
        <WeightChart records={data.records} />
      </section>

      <ExpenseSummaryCard expenseRecords={data.expenseRecords} />
    </div>
  );
}
