"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "@/components/app-provider";
import { MealEntryForm } from "@/components/meal-entry-form";
import type { FoodItem, MealRecord, MealType } from "@/lib/types";
import { findFoodItem } from "@/lib/utils";

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

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

function MealEditModal({
  record,
  foodItems,
  mealRecords,
  onClose
}: {
  record: MealRecord;
  foodItems: FoodItem[];
  mealRecords: MealRecord[];
  onClose: () => void;
}) {
  const { updateMealRecord, deleteMealRecord } = useAppData();

  return (
    <MealModalShell title="食事を編集" onClose={onClose}>
      <MealEntryForm
        foodItems={foodItems}
        mealRecords={mealRecords.filter((item) => item.id !== record.id)}
        initialValue={{
          mealType: record.mealType,
          foodItemId: record.foodItemId,
          grams: `${record.grams}`,
          time: record.time,
          leftoverRate: `${record.leftoverRate}`,
          memo: record.memo
        }}
        submitLabel="更新する"
        onDelete={() => {
          if (window.confirm("この食事記録を削除しますか？")) {
            deleteMealRecord(record.id);
            onClose();
          }
        }}
        onSubmit={(draft) => {
          updateMealRecord(record.id, {
            date: record.date,
            time: draft.time,
            mealType: draft.mealType,
            foodItemId: draft.foodItemId,
            grams: draft.grams,
            leftoverRate: draft.leftoverRate,
            memo: draft.memo
          });
          onClose();
        }}
      />
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
                    <button
                      key={record.id}
                      type="button"
                      className="w-full rounded-2xl bg-white/70 px-3 py-3 text-left text-sm leading-6 text-ink/75 transition hover:bg-white active:scale-[0.99]"
                      onClick={() => setEditingRecord(record)}
                    >
                      <p className="break-words">{detailParts.join(" ")}</p>
                      {record.memo ? <p className="mt-1 break-words text-ink/60">{record.memo}</p> : null}
                    </button>
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
        <MealEditModal
          record={editingRecord}
          foodItems={foodItems}
          mealRecords={mealRecords}
          onClose={() => setEditingRecord(null)}
        />
      ) : null}
    </section>
  );
}
