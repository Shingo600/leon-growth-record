"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FoodDatabaseSelector } from "@/components/food-database-selector";
import { useAppData } from "@/components/app-provider";
import { ActivityCategory, ActivityKind, FoodItem, MealType } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

const activityKinds: ActivityKind[] = [
  "散歩",
  "散歩（匂い嗅ぎ中心）",
  "ボール遊び",
  "引っ張りっこ",
  "ノーズワーク",
  "知育トイ",
  "コマンド練習",
  "社会化"
];

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

function getCategory(kind: ActivityKind): ActivityCategory {
  if (kind === "散歩" || kind === "散歩（匂い嗅ぎ中心）") {
    return "散歩";
  }

  if (kind === "コマンド練習" || kind === "社会化") {
    return "トレーニング";
  }

  return "知育遊び";
}

function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-ink/35" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center px-4 pb-6 pt-10 sm:items-center">
        <div
          className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-5 shadow-card"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button type="button" className="button-secondary cursor-pointer px-4 py-2" onClick={onClose}>
              閉じる
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ActivityModal({
  onClose,
  initialKind
}: {
  onClose: () => void;
  initialKind: ActivityKind;
}) {
  const { addActivityRecord } = useAppData();
  const [kind, setKind] = useState<ActivityKind>(initialKind);
  const [form, setForm] = useState({
    startTime: "07:00",
    durationMinutes: "15",
    memo: ""
  });

  return (
    <ModalShell title="活動を記録" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          addActivityRecord({
            date: getTodayDateString(),
            startTime: form.startTime,
            durationMinutes: Number(form.durationMinutes),
            category: getCategory(kind),
            kind,
            memo: form.memo
          });
          onClose();
        }}
      >
        <div>
          <label className="label" htmlFor="activity-kind">種類</label>
          <select
            id="activity-kind"
            className="input"
            value={kind}
            onChange={(event) => setKind(event.target.value as ActivityKind)}
          >
            {activityKinds.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="activity-time">開始時刻</label>
          <input
            id="activity-time"
            className="input"
            type="time"
            value={form.startTime}
            onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="activity-duration">時間（分）</label>
          <input
            id="activity-duration"
            className="input"
            type="number"
            min="1"
            value={form.durationMinutes}
            onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="activity-memo">メモ</label>
          <textarea
            id="activity-memo"
            className="input min-h-24 resize-none"
            value={form.memo}
            onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
          />
        </div>

        <button className="button-primary w-full cursor-pointer" type="submit">
          記録する
        </button>
      </form>
    </ModalShell>
  );
}

function MealModal({ onClose, foodItems }: { onClose: () => void; foodItems: FoodItem[] }) {
  const { addMealRecord } = useAppData();
  const hasFoodItems = foodItems.length > 0;
  const [form, setForm] = useState({
    mealType: "朝" as MealType,
    foodItemId: foodItems[0]?.id ?? "",
    grams: "55",
    time: "07:10",
    leftoverRate: "0",
    memo: ""
  });

  return (
    <ModalShell title="ごはんを記録" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!hasFoodItems || !form.foodItemId) {
            return;
          }
          addMealRecord({
            date: getTodayDateString(),
            time: form.time,
            mealType: form.mealType,
            foodItemId: form.foodItemId,
            grams: Number(form.grams),
            leftoverRate: Number(form.leftoverRate),
            memo: form.memo
          });
          onClose();
        }}
      >
        <div>
          <label className="label" htmlFor="meal-type">食事区分</label>
          <select
            id="meal-type"
            className="input"
            value={form.mealType}
            onChange={(event) => setForm((current) => ({ ...current, mealType: event.target.value as MealType }))}
          >
            {mealTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">ごはん</label>
          <FoodDatabaseSelector
            foodItems={foodItems}
            value={form.foodItemId}
            onChange={(value) => setForm((current) => ({ ...current, foodItemId: value }))}
          />
          {!hasFoodItems ? (
            <p className="mt-2 text-xs leading-5 text-ink/55">
              先にプロフィール画面の「ごはんデータベース」でフードを登録してください。
            </p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="meal-grams">グラム数</label>
          <input
            id="meal-grams"
            className="input"
            type="number"
            min="1"
            value={form.grams}
            onChange={(event) => setForm((current) => ({ ...current, grams: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="meal-time">食べた時刻</label>
          <input
            id="meal-time"
            className="input"
            type="time"
            value={form.time}
            onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="meal-leftover">食べ残し率（%）</label>
          <input
            id="meal-leftover"
            className="input"
            type="number"
            min="0"
            max="100"
            value={form.leftoverRate}
            onChange={(event) => setForm((current) => ({ ...current, leftoverRate: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="meal-memo">メモ</label>
          <textarea
            id="meal-memo"
            className="input min-h-24 resize-none"
            value={form.memo}
            onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
          />
        </div>

        <button className="button-primary w-full cursor-pointer disabled:opacity-50" type="submit" disabled={!hasFoodItems || !form.foodItemId}>
          記録する
        </button>
      </form>
    </ModalShell>
  );
}

export function QuickAddActions({ foodItems }: { foodItems: FoodItem[] }) {
  const [mode, setMode] = useState<"activity" | "meal" | null>(null);
  const [activityKind, setActivityKind] = useState<ActivityKind>("散歩");

  return (
    <section className="card relative z-10 isolate space-y-4 p-5">
      <div>
        <p className="text-sm text-ink/60">クイック入力</p>
        <h3 className="mt-1 text-xl font-semibold">すぐ記録する</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="button-primary relative z-10 w-full cursor-pointer"
          onClick={() => {
            setActivityKind("散歩");
            setMode("activity");
          }}
        >
          散歩を記録
        </button>
        <button
          type="button"
          className="button-secondary relative z-10 w-full cursor-pointer"
          onClick={() => {
            setActivityKind("ノーズワーク");
            setMode("activity");
          }}
        >
          知育遊びを記録
        </button>
        <button
          type="button"
          className="button-secondary relative z-10 w-full cursor-pointer"
          onClick={() => {
            setActivityKind("コマンド練習");
            setMode("activity");
          }}
        >
          トレーニングを記録
        </button>
        <button
          type="button"
          className="button-secondary relative z-10 w-full cursor-pointer"
          onClick={() => setMode("meal")}
        >
          ごはんを記録
        </button>
      </div>

      {mode === "activity" ? <ActivityModal onClose={() => setMode(null)} initialKind={activityKind} /> : null}
      {mode === "meal" ? <MealModal onClose={() => setMode(null)} foodItems={foodItems} /> : null}
    </section>
  );
}
