"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/app-provider";
import { buildActivityItems, getActivityCompletionRate, type ActivityItem } from "@/lib/activity";
import type { ActivityRecord, DailyGoals } from "@/lib/types";

function EditMinutesRow({
  item,
  onSave,
  onCancel
}: {
  item: ActivityItem;
  onSave: (minutes: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(`${item.current}`);

  return (
    <div className="mt-3 rounded-2xl bg-white/80 p-3">
      <label className="label" htmlFor={`activity-edit-${item.key}`}>
        分数を直接修正
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={`activity-edit-${item.key}`}
          className="input flex-1"
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, ""))}
        />
        <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={onCancel}>
          閉じる
        </button>
        <button
          type="button"
          className="button-primary px-4 py-2 text-sm"
          onClick={() => onSave(Number(value || 0))}
        >
          保存
        </button>
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  today,
  editingKey,
  onStartEdit,
  onFinishEdit
}: {
  item: ActivityItem;
  today: string;
  editingKey: string | null;
  onStartEdit: (key: string) => void;
  onFinishEdit: () => void;
}) {
  const { incrementActivity, decrementActivity, setActivityMinutes, completeActivity, resetActivity } = useAppData();
  const isEditing = editingKey === item.key;

  return (
    <div className="rounded-3xl bg-cream/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{item.label}</p>
          <p className="mt-1 text-sm text-ink/65">
            今日の実績 {item.current}分 / 目標{item.goal}分
          </p>
          <p className="mt-1 text-sm text-ink/65">あと {item.remaining}分</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70">{item.status}</span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-warm transition-all" style={{ width: `${item.progress}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        <button
          type="button"
          className="button-secondary w-full px-2 py-2 text-sm"
          onClick={() => decrementActivity(today, item.category, item.quickKind, 10)}
        >
          -10分
        </button>
        <button
          type="button"
          className="button-secondary w-full px-2 py-2 text-sm"
          onClick={() => decrementActivity(today, item.category, item.quickKind, 5)}
        >
          -5分
        </button>
        <button
          type="button"
          className="button-secondary w-full px-2 py-2 text-sm"
          onClick={() => incrementActivity(today, item.category, item.quickKind, 5)}
        >
          +5分
        </button>
        <button
          type="button"
          className="button-secondary w-full px-2 py-2 text-sm"
          onClick={() => incrementActivity(today, item.category, item.quickKind, 10)}
        >
          +10分
        </button>
        <button
          type="button"
          className="button-primary w-full px-2 py-2 text-sm"
          onClick={() => completeActivity(today, item.category, item.quickKind, item.goal)}
        >
          完了
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="button-secondary w-full px-3 py-2 text-sm"
          onClick={() => onStartEdit(item.key)}
        >
          編集
        </button>
        <button
          type="button"
          className="button-secondary w-full px-3 py-2 text-sm"
          onClick={() => {
            if (window.confirm(`${item.label}を0分に戻しますか？`)) {
              resetActivity(today, item.category, item.quickKind);
              onFinishEdit();
            }
          }}
        >
          リセット
        </button>
      </div>

      {isEditing ? (
        <EditMinutesRow
          item={item}
          onCancel={onFinishEdit}
          onSave={(minutes) => {
            setActivityMinutes(today, item.category, item.quickKind, minutes);
            onFinishEdit();
          }}
        />
      ) : null}
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const items = useMemo(() => buildActivityItems(activityRecords, goals, today), [activityRecords, goals, today]);
  const totalRate = getActivityCompletionRate(items);

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
          <ActivityRow
            key={item.key}
            item={item}
            today={today}
            editingKey={editingKey}
            onStartEdit={setEditingKey}
            onFinishEdit={() => setEditingKey(null)}
          />
        ))}
      </div>
    </section>
  );
}
