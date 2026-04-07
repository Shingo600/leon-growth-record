"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FoodDatabaseSelector } from "@/components/food-database-selector";
import { useAppData } from "@/components/app-provider";
import { FoodItem, MealType } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

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
            <button type="button" className="button-secondary px-4 py-2" onClick={onClose}>
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
          <label className="label" htmlFor="meal-type">
            食事の種類
          </label>
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
          <label className="label">フード</label>
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
          <label className="label" htmlFor="meal-grams">
            グラム数
          </label>
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
          <label className="label" htmlFor="meal-time">
            食べた時間
          </label>
          <input
            id="meal-time"
            className="input time-input"
            type="time"
            value={form.time}
            onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="meal-leftover">
            食べ残し率
          </label>
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
          <label className="label" htmlFor="meal-memo">
            メモ
          </label>
          <textarea
            id="meal-memo"
            className="input min-h-24 resize-none"
            value={form.memo}
            onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
          />
        </div>

        <button className="button-primary w-full disabled:opacity-50" type="submit" disabled={!hasFoodItems || !form.foodItemId}>
          記録する
        </button>
      </form>
    </ModalShell>
  );
}

export function QuickAddActions({
  foodItems,
  todayRecordHref
}: {
  foodItems: FoodItem[];
  todayRecordHref: string;
}) {
  const [mode, setMode] = useState<"meal" | null>(null);

  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="text-sm text-ink/60">今日の記録</p>
        <h3 className="mt-1 text-xl font-semibold">すぐ記録する</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" className="button-primary w-full" onClick={() => setMode("meal")}>
          ごはんを記録
        </button>
        <Link href={todayRecordHref} className="button-secondary w-full">
          今日の記録を追加
        </Link>
      </div>

      {mode === "meal" ? <MealModal onClose={() => setMode(null)} foodItems={foodItems} /> : null}
    </section>
  );
}
