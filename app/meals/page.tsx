"use client";

import { useMemo, useState } from "react";
import { FoodDatabaseManager } from "@/components/food-database-manager";
import { MealEntryForm } from "@/components/meal-entry-form";
import { MealRecordModal } from "@/components/meal-record-modal";
import { useAppData } from "@/components/app-provider";
import type { MealRecord, MealType } from "@/lib/types";
import { findFoodItem, formatDate, getTodayDateString } from "@/lib/utils";

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

function formatLeftover(rate: number) {
  if (rate === 0) {
    return "完食";
  }

  if (rate >= 80) {
    return "ほぼ残し";
  }

  if (rate >= 50) {
    return "半量";
  }

  return `残し ${rate}%`;
}

export default function MealsPage() {
  const { data, addMealRecord } = useAppData();
  const today = getTodayDateString();
  const [editingRecord, setEditingRecord] = useState<MealRecord | null>(null);
  const [formVersion, setFormVersion] = useState(0);

  const todayMeals = useMemo(
    () => data.mealRecords.filter((record) => record.date === today),
    [data.mealRecords, today]
  );
  const totalServedGrams = todayMeals.reduce((sum, record) => sum + record.grams, 0);
  const totalEatenGrams = todayMeals.reduce((sum, record) => sum + record.grams * (1 - record.leftoverRate / 100), 0);
  const leftoverGrams = Math.max(Math.round(totalServedGrams - totalEatenGrams), 0);
  const latestMeal = data.mealRecords[0];

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">レオンの毎日の食事を記録して、食生活を管理しましょう。</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">ごはん記録</h2>
        </div>
        <div className="rounded-full bg-white px-4 py-3 text-sm font-bold text-ink/70 ring-1 ring-line">
          {formatDate(today, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-xl text-white" aria-hidden="true">🍚</div>
            <p className="text-sm font-bold text-ink/70">今日のごはん</p>
          </div>
          <p className="mt-5 text-5xl font-bold tracking-tight">{todayMeals.length}<span className="ml-1 text-xl">回</span></p>
          <p className="mt-3 text-sm text-ink/55">
            {latestMeal ? `最終: ${latestMeal.time}（${latestMeal.mealType}）` : "今日はまだ未記録です"}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl text-emerald-700" aria-hidden="true">g</div>
            <p className="text-sm font-bold text-ink/70">今日合計</p>
          </div>
          <p className="mt-5 text-5xl font-bold tracking-tight">{Math.round(totalEatenGrams)}<span className="ml-1 text-xl">g</span></p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-cream">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(Math.round((totalEatenGrams / Math.max(totalServedGrams, 1)) * 100), 100)}%` }} />
          </div>
          <p className="mt-3 text-sm text-ink/55">出した量 {Math.round(totalServedGrams)}g</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-xl text-amber-700" aria-hidden="true">%</div>
            <p className="text-sm font-bold text-ink/70">食べ残し</p>
          </div>
          <p className="mt-5 text-5xl font-bold tracking-tight">{leftoverGrams}<span className="ml-1 text-xl">g</span></p>
          <p className="mt-3 text-sm text-ink/55">
            {leftoverGrams === 0 && todayMeals.length > 0 ? "今日はよく食べています" : "残し具合をメモしておくと安心です"}
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <section className="card space-y-4 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">今日の食事</p>
                <h3 className="mt-1 text-2xl font-bold">朝・昼・夜・おやつ</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                {todayMeals.length}/4 記録
              </span>
            </div>

            <div className="space-y-3">
              {mealTypes.map((mealType) => {
                const records = todayMeals.filter((record) => record.mealType === mealType);

                return (
                  <div key={mealType} className="grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                    <div className="flex items-center gap-3 sm:block">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700" aria-hidden="true">
                        {mealType}
                      </div>
                      <p className="mt-0 text-sm font-semibold text-ink/55 sm:mt-2">
                        {records[0]?.time ?? "未記録"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {records.length > 0 ? (
                        records.map((record) => {
                          const food = findFoodItem(data.foodItems, record.foodItemId);

                          return (
                            <button
                              key={record.id}
                              type="button"
                              className="w-full rounded-2xl bg-cream/70 px-4 py-3 text-left transition hover:bg-indigo-50 active:scale-[0.99]"
                              onClick={() => setEditingRecord(record)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-base font-bold">{food?.productName ?? "フード未登録"}</p>
                                  <p className="mt-1 truncate text-sm text-ink/60">{food?.maker || record.memo || "メモなし"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-xl font-bold">{record.grams}g</p>
                                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${record.leftoverRate === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {formatLeftover(record.leftoverRate)}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl bg-cream/70 px-4 py-4 text-sm font-semibold text-ink/45">
                          まだ記録がありません
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <FoodDatabaseManager />
        </div>

        <aside className="space-y-5">
          <section className="card space-y-4 p-5 md:p-6">
            <div>
              <p className="text-sm font-semibold text-indigo-600">クイック入力</p>
              <h3 className="mt-1 text-2xl font-bold">ごはんをすぐ記録</h3>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                食事の種類を選ぶと前回値を引き継ぎます。必要なところだけ直して保存できます。
              </p>
            </div>
            <MealEntryForm
              key={formVersion}
              foodItems={data.foodItems}
              mealRecords={data.mealRecords}
              submitLabel="保存する"
              onSubmit={(draft) => {
                addMealRecord({
                  date: today,
                  time: draft.time,
                  mealType: draft.mealType,
                  foodItemId: draft.foodItemId,
                  grams: draft.grams,
                  leftoverRate: draft.leftoverRate,
                  memo: draft.memo
                });
                setFormVersion((current) => current + 1);
              }}
            />
          </section>

          <section className="card overflow-hidden p-5">
            <p className="text-sm font-semibold text-indigo-600">ごはんのヒント</p>
            <h3 className="mt-2 text-lg font-bold">迷ったら「いつもの朝・夜」からでOK</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              毎日の記録は細かく完璧でなくても大丈夫です。食べた量と残し具合だけでも、後から変化に気づきやすくなります。
            </p>
          </section>
        </aside>
      </div>

      {editingRecord ? (
        <MealRecordModal selectedDate={null} editingRecord={editingRecord} onClose={() => setEditingRecord(null)} />
      ) : null}
    </div>
  );
}
