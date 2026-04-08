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
import {
  buildActivityItems,
  getActivityCompletionRate,
  getActivitySummaryMessage,
  getPendingActivityItems
} from "@/lib/activity";
import { getAgeText, getTodayDateString, getUpcomingEvents } from "@/lib/utils";

export default function HomePage() {
  const { data } = useAppData();
  const today = getTodayDateString();
  const upcomingEvents = getUpcomingEvents(data.events).slice(0, 3);
  const activityItems = buildActivityItems(data.activityRecords, data.profile.dailyGoals, today);
  const pendingItems = getPendingActivityItems(activityItems);
  const mealsToday = data.mealRecords.filter((item) => item.date === today);
  const hasWeightToday = data.records.some((item) => item.date === today);
  const todayRecord = data.records.find((item) => item.date === today);
  const todayRecordHref = todayRecord ? `/records/${todayRecord.id}/edit` : "/records/new";

  const dynamicMessage = getActivitySummaryMessage(activityItems);
  const totalRate = getActivityCompletionRate(activityItems);

  const tasks = pendingItems.map((item) => ({
    label: item.label,
    remaining: item.remaining
  }));

  const balanceItems = [
    { label: "身体活動", value: `${activityItems[0] ? Math.round(Math.min((activityItems[0].current / activityItems[0].goal) * 100, 100)) : 0}%` },
    {
      label: "知的刺激",
      value: `${activityItems[1] ? Math.round(Math.min((activityItems[1].current / activityItems[1].goal) * 100, 100)) : 0}%`
    },
    { label: "食事記録", value: mealsToday.length > 0 ? "100%" : "0%" },
    { label: "体重記録", value: hasWeightToday ? "入力ずみ" : "未入力" }
  ];

  const balanceComment =
    pendingItems.length === 0
      ? "今日はぜんぶ達成！レオンえらい！"
      : pendingItems.length === 1
        ? `${pendingItems[0].label}をあと${pendingItems[0].remaining}分で達成です。`
        : `${pendingItems[0].label}と${pendingItems[1].label}を少し進めると、今日のバランスが整います。`;

  return (
    <div className="space-y-5">
      <section className="card flex items-center gap-4 p-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-cream">
          <img src={data.profile.photoUrl || "/placeholder-dog.svg"} alt={`${data.profile.name}の写真`} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink/60">毎日ひと目でわかる育成ダッシュボード</p>
          <h2 className="mt-1 text-3xl font-semibold">{data.profile.name}</h2>
          <p className="mt-1 text-sm text-ink/70">
            {data.profile.breed} / {getAgeText(data.profile.birthday)}
          </p>
          <p className="mt-3 rounded-3xl bg-cream px-4 py-3 text-sm leading-6 text-ink/75">{dynamicMessage}</p>
        </div>
      </section>

      <ActivitySummaryCard activityRecords={data.activityRecords} goals={data.profile.dailyGoals} today={today} />
      <TodayTasksCard tasks={tasks} />
      <QuickAddActions foodItems={data.foodItems} todayRecordHref={todayRecordHref} />
      <MealSummaryCard mealRecords={data.mealRecords} foodItems={data.foodItems} today={today} />
      <BalanceInsightCard items={balanceItems} comment={pendingItems.length === 0 ? `活動達成率 ${totalRate}% で気持ちよく1日を終えられそうです。` : balanceComment} />

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
          <EmptyState title="予定はまだありません" description="散歩や通院の予定を登録しておくと見返しやすくなります。" />
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
