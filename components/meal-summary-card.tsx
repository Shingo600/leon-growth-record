"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "@/components/app-provider";
import { FoodDatabaseSelector } from "@/components/food-database-selector";
import { FoodItem, MealRecord, MealType } from "@/lib/types";
import { findFoodItem } from "@/lib/utils";

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

type MealFormState = {
  mealType: MealType;
  foodItemId: string;
  grams: string;
  time: string;
  leftoverRate: string;
  memo: string;
};

function MealModalShell({
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

function toMealFormState(record: MealRecord): MealFormState {
  return {
    mealType: record.mealType,
    foodItemId: record.foodItemId,
    grams: String(record.grams),
    time: record.time,
    leftoverRate: String(record.leftoverRate),
    memo: record.memo
  };
}

function MealEditModal({
  record,
  foodItems,
  onClose
}: {
  record: MealRecord;
  foodItems: FoodItem[];
  onClose: () => void;
}) {
  const { updateMealRecord, deleteMealRecord } = useAppData();
  const [form, setForm] = useState<MealFormState>(() => toMealFormState(record));

  return (
    <MealModalShell title="ごはん記録を編集" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          updateMealRecord(record.id, {
            date: record.date,
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
          <label className="label" htmlFor="edit-meal-type">
            食事の種類
          </label>
          <select
            id="edit-meal-type"
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
        </div>

        <div>
          <label className="label" htmlFor="edit-meal-grams">
            グラム数
          </label>
          <input
            id="edit-meal-grams"
            className="input"
            type="number"
            min="1"
            value={form.grams}
            onChange={(event) => setForm((current) => ({ ...current, grams: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-meal-time">
            食べた時間
          </label>
          <input
            id="edit-meal-time"
            className="input time-input"
            type="time"
            value={form.time}
            onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-meal-leftover">
            食べ残し率
          </label>
          <input
            id="edit-meal-leftover"
            className="input"
            type="number"
            min="0"
            max="100"
            value={form.leftoverRate}
            onChange={(event) => setForm((current) => ({ ...current, leftoverRate: event.target.value }))}
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-meal-memo">
            メモ
          </label>
          <textarea
            id="edit-meal-memo"
            className="input min-h-24 resize-none"
            value={form.memo}
            onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="button-secondary w-full"
            onClick={() => {
              if (window.confirm("このごはん記録を削除しますか？")) {
                deleteMealRecord(record.id);
                onClose();
              }
            }}
          >
            削除
          </button>
          <button className="button-primary w-full" type="submit">
            更新する
          </button>
        </div>
      </form>
    </MealModalShell>
  );
}

export function MealSummaryCard({
  mealRecords,
  foodItems,
  today
}: {
  mealRecords: MealRecord[];
  foodItems: FoodItem[];
  today: string;
}) {
  const { deleteMealRecord } = useAppData();
  const [editingRecord, setEditingRecord] = useState<MealRecord | null>(null);

  const todayMeals = useMemo(
    () => mealRecords.filter((item) => item.date === today),
    [mealRecords, today]
  );

  const totalGrams = todayMeals.reduce((sum, item) => sum + item.grams * (1 - item.leftoverRate / 100), 0);

  const sections = mealTypes
    .map((mealType) => ({
      mealType,
      records: todayMeals.filter((item) => item.mealType === mealType)
    }))
    .filter((section) => section.records.length > 0);

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">今日のごはんサマリー</p>
          <h3 className="mt-1 text-xl font-semibold">食事の記録</h3>
        </div>
        <div className="rounded-3xl bg-cream px-4 py-3 text-right">
          <p className="text-xs text-ink/55">今日合計</p>
          <p className="text-2xl font-semibold">{Math.round(totalGrams)}g</p>
        </div>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map(({ mealType, records }) => (
            <div key={mealType} className="rounded-3xl bg-cream px-4 py-3">
              <p className="text-sm font-semibold">{mealType}</p>
              <div className="mt-2 space-y-2">
                {records.map((record) => {
                  const food = findFoodItem(foodItems, record.foodItemId);
                  const detailParts = [record.time, food?.productName ?? "フード未登録", `${record.grams}g`];

                  if (record.leftoverRate > 0) {
                    detailParts.push(`食べ残し ${record.leftoverRate}%`);
                  }

                  return (
                    <div key={record.id} className="rounded-2xl bg-white/70 px-3 py-3 text-sm leading-6 text-ink/75">
                      <p className="break-words">{detailParts.join(" ")}</p>
                      {record.memo ? <p className="mt-1 break-words text-ink/60">{record.memo}</p> : null}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="button-secondary w-full px-3 py-2 text-xs"
                          onClick={() => setEditingRecord(record)}
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          className="button-secondary w-full px-3 py-2 text-xs"
                          onClick={() => {
                            if (window.confirm("このごはん記録を削除しますか？")) {
                              deleteMealRecord(record.id);
                            }
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-cream px-4 py-4 text-sm leading-6 text-ink/55">
          今日はまだ食事の記録がありません。
        </div>
      )}

      {editingRecord ? (
        <MealEditModal record={editingRecord} foodItems={foodItems} onClose={() => setEditingRecord(null)} />
      ) : null}
    </section>
  );
}
