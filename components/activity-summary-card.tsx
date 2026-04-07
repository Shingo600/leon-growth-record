"use client";

import { useMemo } from "react";
import { useAppData } from "@/components/app-provider";
import { ActivityCategory, ActivityKind, ActivityRecord, DailyGoals } from "@/lib/types";

type ActivityItem = {
  key: string;
  label: string;
  category: ActivityCategory;
  quickKind: ActivityKind;
  current: number;
  goal: number;
};

function getNowTime() {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

function getStatus(current: number, goal: number) {
  if (current <= 0) {
    return "未入力";
  }

  if (current < goal) {
    return "進行中";
  }

  return "達成";
}

function ActivityRow({
  item,
  onAddMinutes,
  onComplete
}: {
  item: ActivityItem;
  onAddMinutes: (item: ActivityItem, minutes: number) => void;
  onComplete: (item: ActivityItem) => void;
}) {
  const remaining = Math.max(item.goal - item.current, 0);
  const progress = item.goal > 0 ? Math.min((item.current / item.goal) * 100, 100) : 0;

  return (
    <div className="rounded-3xl bg-cream/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{item.label}</p>
          <p className="mt-1 text-sm text-ink/65">
            今日 {item.current}分 / 目標 {item.goal}分
          </p>
          <p className="mt-1 text-sm text-ink/65">あと {remaining}分</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70">
          {getStatus(item.current, item.goal)}
        </span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-warm transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => onAddMinutes(item, 5)}>
          +5分
        </button>
        <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => onAddMinutes(item, 10)}>
          +10分
        </button>
        <button
          type="button"
          className="button-primary w-full px-3 py-2 text-sm disabled:cursor-default disabled:opacity-45"
          onClick={() => onComplete(item)}
          disabled={remaining <= 0}
        >
          完了
        </button>
      </div>
    </div>
  );
}

export function ActivitySummaryCard({
  activityRecords,
  goals,
  today
}: {
  activityRecords: ActivityRecord[];
  goals: DailyGoals;
  today: string;
}) {
  const { addActivityRecord } = useAppData();

  const items = useMemo<ActivityItem[]>(() => {
    const todayRecords = activityRecords.filter((item) => item.date === today);
    const walkMinutes = todayRecords
      .filter((item) => item.category === "散歩")
      .reduce((sum, item) => sum + item.durationMinutes, 0);
    const intelligenceMinutes = todayRecords
      .filter((item) => item.category === "知育遊び")
      .reduce((sum, item) => sum + item.durationMinutes, 0);
    const trainingMinutes = todayRecords
      .filter((item) => item.category === "トレーニング")
      .reduce((sum, item) => sum + item.durationMinutes, 0);

    return [
      { key: "walk", label: "散歩", category: "散歩", quickKind: "散歩", current: walkMinutes, goal: goals.walkMinutes },
      {
        key: "intelligence",
        label: "知育遊び",
        category: "知育遊び",
        quickKind: "ノーズワーク",
        current: intelligenceMinutes,
        goal: goals.intelligenceMinutes
      },
      {
        key: "training",
        label: "トレーニング",
        category: "トレーニング",
        quickKind: "コマンド練習",
        current: trainingMinutes,
        goal: goals.trainingMinutes
      }
    ];
  }, [activityRecords, goals, today]);

  const totalRate = Math.round(
    (items.reduce((sum, item) => sum + Math.min(item.current / item.goal, 1), 0) / items.length) * 100
  );

  function addMinutes(item: ActivityItem, minutes: number) {
    addActivityRecord({
      date: today,
      startTime: getNowTime(),
      durationMinutes: minutes,
      category: item.category,
      kind: item.quickKind,
      memo: ""
    });
  }

  function completeItem(item: ActivityItem) {
    const remaining = Math.max(item.goal - item.current, 0);
    if (remaining > 0) {
      addMinutes(item, remaining);
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">今日の活動サマリー</p>
          <h3 className="mt-1 text-xl font-semibold">活動バランス</h3>
        </div>
        <div className="rounded-3xl bg-cream px-4 py-3 text-right">
          <p className="text-xs text-ink/55">全体達成率</p>
          <p className="text-2xl font-semibold">{totalRate}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ActivityRow key={item.key} item={item} onAddMinutes={addMinutes} onComplete={completeItem} />
        ))}
      </div>
    </section>
  );
}
