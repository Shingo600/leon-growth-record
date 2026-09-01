"use client";

import Link from "next/link";
import { ActivitySummaryCard } from "@/components/activity-summary-card";
import { BalanceInsightCard } from "@/components/balance-insight-card";
import { DailyEasyCheckCard } from "@/components/daily-easy-check-card";
import { EmptyState } from "@/components/empty-state";
import { ExpenseSummaryCard } from "@/components/expense-summary-card";
import { MealSummaryCard } from "@/components/meal-summary-card";
import { QuickAddActions } from "@/components/quick-add-actions";
import { TodayTasksCard } from "@/components/today-tasks-card";
import { WeightChart } from "@/components/weight-chart";
import { useAppData } from "@/components/app-provider";
import type { MealType } from "@/lib/types";
import {
  buildActivityItems,
  getActivityCompletionRate,
  getActivitySummaryMessage,
  getPendingActivityItems
} from "@/lib/activity";
import { formatDate, getTodayDateString, getUpcomingEvents } from "@/lib/utils";

const mealTypeLabels: MealType[] = ["朝", "昼", "夜", "おやつ"];

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
  const latestRecord = data.records[0];
  const latestHealthRecord = data.healthRecords[0];
  const todaysPractices = data.commandPracticeRecords.filter((item) => item.date === today);
  const trainingCommands = data.dogCommands.filter((command) => command.status !== "習得");
  const completedMealTypes = new Set(mealsToday.map((meal) => meal.mealType));

  const dynamicMessage = getActivitySummaryMessage(activityItems);
  const totalRate = getActivityCompletionRate(activityItems);
  const todayLabel = formatDate(today, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
  const currentWeight = todayRecord?.taijyuu ?? latestRecord?.taijyuu ?? data.profile.currentWeight;
  const weightDiff =
    todayRecord && latestRecord && todayRecord.id !== latestRecord.id
      ? todayRecord.taijyuu - latestRecord.taijyuu
      : null;

  const tasks = pendingItems.map((item) => ({
    label: item.label,
    remaining: item.remaining
  }));

  const balanceItems = [
    {
      label: "身体活動",
      value: `${activityItems[0] && activityItems[0].goal > 0 ? Math.round(Math.min((activityItems[0].current / activityItems[0].goal) * 100, 100)) : 0}%`
    },
    {
      label: "知的刺激",
      value: `${activityItems[1] && activityItems[1].goal > 0 ? Math.round(Math.min((activityItems[1].current / activityItems[1].goal) * 100, 100)) : 0}%`
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
      <section className="card overflow-hidden p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-3xl" aria-hidden="true">
              ☀
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-600">{todayLabel}</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">今日のまとめ</h2>
              <p className="mt-1 text-sm leading-6 text-ink/65">レオンの毎日をチェックして、健やかな成長をサポートしましょう。</p>
            </div>
          </div>
          <Link href={todayRecordHref} className="button-secondary px-4 py-3">
            今日やること
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <Link href={todayRecordHref} className="rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink/70">体重</p>
              <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">記録</span>
            </div>
            <p className="mt-5 text-4xl font-bold tracking-tight">{currentWeight}<span className="ml-1 text-lg font-semibold">kg</span></p>
            <p className="mt-2 text-sm text-ink/55">
              {hasWeightToday ? "今日の体重を記録済み" : latestRecord ? `前回 ${latestRecord.taijyuu}kg` : "プロフィール値を表示"}
            </p>
            {weightDiff !== null ? (
              <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                前回比 {weightDiff >= 0 ? "+" : ""}{weightDiff.toFixed(1)}kg
              </span>
            ) : null}
          </Link>

          <Link href="/meals" className="rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink/70">ごはん</p>
              <span className="rounded-xl bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">{completedMealTypes.size}/4</span>
            </div>
            <p className="mt-5 text-4xl font-bold tracking-tight">{mealsToday.length}<span className="ml-1 text-lg font-semibold">件</span></p>
            <p className="mt-2 text-sm text-ink/55">
              {mealsToday[0] ? `${mealsToday[0].mealType} ${mealsToday[0].grams}g` : "まだ食事記録はありません"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {mealTypeLabels.map((mealType) => (
                <span
                  key={mealType}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    completedMealTypes.has(mealType) ? "bg-emerald-50 text-emerald-700" : "bg-cream text-ink/45"
                  }`}
                >
                  {mealType}
                </span>
              ))}
            </div>
          </Link>

          <section className="rounded-3xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink/70">活動バランス</p>
              <span className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{totalRate}%</span>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-24 w-24 place-items-center rounded-full border-[10px] border-indigo-500 bg-indigo-50 text-xl font-bold text-indigo-800">
                {totalRate}%
              </div>
              <div className="space-y-2 text-sm">
                {activityItems.map((item) => (
                  <p key={item.key} className="font-semibold text-ink/70">
                    {item.label} <span className="text-indigo-700">{item.current}分</span>
                  </p>
                ))}
              </div>
            </div>
            <p className="mt-4 rounded-full bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-emerald-700">
              {pendingItems.length === 0 ? "良いバランスです" : `あと${pendingItems.length}項目`}
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink/70">健康</p>
              <span className="rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">確認</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["体調", todayRecord?.energyLevel ?? "未入力"],
                ["食欲", todayRecord?.appetite ?? "未入力"],
                ["うんち", todayRecord?.poopCondition ?? "未入力"]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink/65">{label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${value === "未入力" ? "bg-cream text-ink/45" : "bg-emerald-50 text-emerald-700"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/health" className="button-secondary mt-5 w-full px-3 py-2 text-sm">
              健康記録を見る
            </Link>
          </section>
        </div>
      </section>

      <DailyEasyCheckCard today={today} todayRecordHref={todayRecordHref} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">予定・カレンダー</p>
                  <h3 className="mt-1 text-xl font-bold">今日からの予定</h3>
                </div>
                <Link href="/calendar" className="button-secondary px-4 py-2 text-sm">
                  カレンダーを開く
                </Link>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="rounded-3xl border border-line bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{event.title}</p>
                          <p className="mt-1 text-xs text-ink/55">{event.date} {event.time}</p>
                        </div>
                        <Link href={`/events/${event.id}/edit`} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                          編集
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="予定はまだありません" description="散歩や通院の予定を登録しておくと見返しやすくなります。" />
              )}
            </section>

            <section className="card space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">コマンドトレーニング</p>
                  <h3 className="mt-1 text-xl font-bold">習得中のコマンド</h3>
                </div>
                <Link href="/commands" className="button-secondary px-4 py-2 text-sm">
                  コマンド一覧へ
                </Link>
              </div>
              <div className="space-y-3">
                {trainingCommands.slice(0, 3).map((command) => (
                  <div key={command.id} className="rounded-3xl border border-line bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{command.name}</p>
                        <p className="mt-1 text-xs text-ink/55">{command.status} / 合図 {command.cueType}</p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{command.successRate}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(command.successRate, 100)}%` }} />
                    </div>
                  </div>
                ))}
                {trainingCommands.length === 0 ? (
                  <p className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-700">
                    習得中のコマンドはありません。新しいコマンドを追加してみましょう。
                  </p>
                ) : null}
              </div>
              <p className="rounded-3xl bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white">
                今日の練習 {todaysPractices.length}件
              </p>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <MealSummaryCard mealRecords={data.mealRecords} foodItems={data.foodItems} today={today} />
            <ActivitySummaryCard activityRecords={data.activityRecords} goals={data.profile.dailyGoals} today={today} />
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">体重推移</h3>
            <WeightChart records={data.records} />
          </section>
        </div>

        <aside className="space-y-5">
          <TodayTasksCard tasks={tasks} />
          <QuickAddActions foodItems={data.foodItems} todayRecordHref={todayRecordHref} />
          <BalanceInsightCard items={balanceItems} comment={pendingItems.length === 0 ? `活動達成率 ${totalRate}% で気持ちよく1日を終えられそうです。` : balanceComment} />
          <section className="card overflow-hidden p-5">
            <p className="text-sm font-semibold text-indigo-600">今日のひとこと</p>
            <p className="mt-3 text-sm leading-6 text-ink/70">{dynamicMessage}</p>
            <div className="mt-4 rounded-3xl bg-amber-50 px-4 py-3 text-sm leading-6 text-ink/70">
              新しいことを覚えるのに最適な時間です。短く褒めて、楽しく練習してあげましょう。
            </div>
          </section>
          {latestHealthRecord ? (
            <section className="card p-5">
              <p className="text-sm font-semibold text-indigo-600">直近の健康記録</p>
              <h3 className="mt-2 text-lg font-bold">{latestHealthRecord.title}</h3>
              <p className="mt-1 text-sm text-ink/55">{latestHealthRecord.date} / {latestHealthRecord.type}</p>
            </section>
          ) : null}
        </aside>
      </div>

      <ExpenseSummaryCard expenseRecords={data.expenseRecords} />
    </div>
  );
}
