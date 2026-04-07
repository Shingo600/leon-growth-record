"use client";

import { useEffect, useMemo, useState } from "react";
import { FoodDatabaseSelector } from "@/components/food-database-selector";
import type { FoodItem, MealRecord, MealType } from "@/lib/types";
import { sortMealRecords } from "@/lib/utils";

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

const leftoverChips = [
  { label: "完食", value: 0 },
  { label: "少し残した", value: 10 },
  { label: "半分残した", value: 50 },
  { label: "ほぼ食べず", value: 80 },
  { label: "全残し", value: 100 }
] as const;

const memoChips = ["食いつき良い", "少し残した", "薬まぜた", "ふやかした", "体調ふつう"] as const;

type MealDraft = {
  mealType: MealType;
  foodItemId: string;
  grams: string;
  time: string;
  leftoverRate: string;
  memo: string;
};

type MealEntryFormProps = {
  foodItems: FoodItem[];
  mealRecords: MealRecord[];
  initialValue?: Partial<MealDraft>;
  submitLabel: string;
  onSubmit: (draft: {
    mealType: MealType;
    foodItemId: string;
    grams: number;
    time: string;
    leftoverRate: number;
    memo: string;
  }) => void;
  onDelete?: () => void;
};

function getNowTimeString() {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

function getSafeTimeByMealType(mealType: MealType) {
  const fallbackTimes: Record<MealType, string> = {
    朝: "07:00",
    昼: "12:00",
    夜: "18:30",
    おやつ: getNowTimeString()
  };

  return fallbackTimes[mealType];
}

function findLatestMealRecord(mealRecords: MealRecord[], mealType?: MealType) {
  const candidates = mealType ? mealRecords.filter((record) => record.mealType === mealType) : mealRecords;
  return sortMealRecords(candidates)[0];
}

function getRecommendedGrams(foodItem: FoodItem | undefined, mealType: MealType) {
  if (!foodItem) {
    return null;
  }

  const mealSpecific = foodItem.mealRecommendations?.[mealType];
  if (typeof mealSpecific === "number" && mealSpecific > 0) {
    return mealSpecific;
  }

  if (typeof foodItem.servingSize === "number" && foodItem.servingSize > 0) {
    return foodItem.servingSize;
  }

  return null;
}

function buildDraftFromRecord(record: MealRecord): MealDraft {
  return {
    mealType: record.mealType,
    foodItemId: record.foodItemId,
    grams: `${record.grams}`,
    time: record.time,
    leftoverRate: `${record.leftoverRate}`,
    memo: record.memo
  };
}

function buildSafeDraft(mealType: MealType, foodItems: FoodItem[]): MealDraft {
  const firstFood = foodItems[0];
  const recommendedGrams = getRecommendedGrams(firstFood, mealType);

  return {
    mealType,
    foodItemId: firstFood?.id ?? "",
    grams: recommendedGrams ? `${recommendedGrams}` : "",
    time: getSafeTimeByMealType(mealType),
    leftoverRate: "0",
    memo: ""
  };
}

function mergeDraft(base: MealDraft, next: Partial<MealDraft>): MealDraft {
  return {
    ...base,
    ...next
  };
}

export function MealEntryForm({
  foodItems,
  mealRecords,
  initialValue,
  submitLabel,
  onSubmit,
  onDelete
}: MealEntryFormProps) {
  const initialDraft = useMemo<MealDraft>(() => {
    const base = buildSafeDraft((initialValue?.mealType as MealType) ?? "朝", foodItems);
    return mergeDraft(base, {
      ...initialValue,
      time: initialValue?.time || getNowTimeString()
    });
  }, [foodItems, initialValue]);

  const [form, setForm] = useState<MealDraft>(initialDraft);

  useEffect(() => {
    setForm(initialDraft);
  }, [initialDraft]);

  const hasFoodItems = foodItems.length > 0;

  function applyMealTypeDefaults(mealType: MealType) {
    const latestByType = findLatestMealRecord(mealRecords, mealType);

    if (latestByType) {
      setForm((current) => ({
        ...current,
        mealType,
        foodItemId: latestByType.foodItemId,
        grams: `${latestByType.grams}`,
        time: latestByType.time || getSafeTimeByMealType(mealType),
        leftoverRate: `${latestByType.leftoverRate}`
      }));
      return;
    }

    setForm((current) => {
      const fallbackFoodId = current.foodItemId || foodItems[0]?.id || "";
      const fallbackFood = foodItems.find((item) => item.id === fallbackFoodId);
      const recommendedGrams = getRecommendedGrams(fallbackFood, mealType);

      return {
        ...current,
        mealType,
        foodItemId: fallbackFoodId,
        grams: recommendedGrams ? `${recommendedGrams}` : current.grams,
        time: getSafeTimeByMealType(mealType),
        leftoverRate: "0"
      };
    });
  }

  function applyFoodDefaults(foodItemId: string) {
    const nextFood = foodItems.find((item) => item.id === foodItemId);
    const recommendedGrams = getRecommendedGrams(nextFood, form.mealType);

    setForm((current) => ({
      ...current,
      foodItemId,
      grams: recommendedGrams ? `${recommendedGrams}` : current.grams
    }));
  }

  function applyPreset(mealType: MealType) {
    const latestByType = findLatestMealRecord(mealRecords, mealType);

    if (latestByType) {
      setForm(buildDraftFromRecord(latestByType));
      return;
    }

    setForm(buildSafeDraft(mealType, foodItems));
  }

  function reuseLatestRecord() {
    const latestRecord = findLatestMealRecord(mealRecords);
    if (!latestRecord) {
      return;
    }

    setForm(buildDraftFromRecord(latestRecord));
  }

  function appendMemoChip(chip: string) {
    setForm((current) => {
      if (current.memo.includes(chip)) {
        return current;
      }

      return {
        ...current,
        memo: current.memo ? `${current.memo} / ${chip}` : chip
      };
    });
  }

  const remainingPercent = Number(form.leftoverRate || 0);
  const canSubmit = hasFoodItems && Boolean(form.foodItemId) && Boolean(form.grams) && Boolean(form.time);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }

        onSubmit({
          mealType: form.mealType,
          foodItemId: form.foodItemId,
          grams: Number(form.grams),
          time: form.time,
          leftoverRate: Number(form.leftoverRate || 0),
          memo: form.memo.trim()
        });
      }}
    >
      <div className="space-y-2">
        <p className="label">クイック操作</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="button-secondary px-3 py-2 text-sm" onClick={() => applyPreset("朝")}>
            いつもの朝
          </button>
          <button type="button" className="button-secondary px-3 py-2 text-sm" onClick={() => applyPreset("夜")}>
            いつもの夜
          </button>
          <button type="button" className="button-secondary px-3 py-2 text-sm" onClick={reuseLatestRecord}>
            前回を再利用
          </button>
          <button
            type="button"
            className="button-secondary px-3 py-2 text-sm"
            onClick={() => setForm((current) => ({ ...current, time: getNowTimeString() }))}
          >
            今の時刻
          </button>
          <button
            type="button"
            className="button-secondary px-3 py-2 text-sm"
            onClick={() => setForm((current) => ({ ...current, leftoverRate: "0" }))}
          >
            完食
          </button>
          <button
            type="button"
            className="button-secondary px-3 py-2 text-sm"
            onClick={() =>
              setForm((current) => ({
                ...current,
                grams: current.grams ? `${Math.max(Math.round(Number(current.grams) / 2), 1)}` : current.grams
              }))
            }
          >
            半量
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="meal-type">
          食事の種類
        </label>
        <select
          id="meal-type"
          className="input"
          value={form.mealType}
          onChange={(event) => applyMealTypeDefaults(event.target.value as MealType)}
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
        <FoodDatabaseSelector foodItems={foodItems} value={form.foodItemId} onChange={applyFoodDefaults} />
        {!hasFoodItems ? (
          <p className="mt-2 text-xs leading-5 text-ink/55">
            先にプロフィール画面の「ごはんデータベース」でフードを登録してください。
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="meal-leftover">
          食べ残し率
        </label>
        <div className="flex flex-wrap gap-2">
          {leftoverChips.map((chip) => {
            const isActive = Number(form.leftoverRate || 0) === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  isActive ? "border-ink bg-ink text-white" : "border-line bg-cream text-ink/75"
                }`}
                onClick={() => setForm((current) => ({ ...current, leftoverRate: `${chip.value}` }))}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <input
          id="meal-leftover"
          className="input"
          type="number"
          min="0"
          max="100"
          value={form.leftoverRate}
          onChange={(event) => setForm((current) => ({ ...current, leftoverRate: event.target.value }))}
        />
        <p className="text-xs text-ink/55">残し率 {remainingPercent}%</p>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="meal-memo">
          メモ
        </label>
        <div className="flex flex-wrap gap-2">
          {memoChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="rounded-full border border-line bg-cream px-3 py-2 text-sm text-ink/75 transition hover:bg-white"
              onClick={() => appendMemoChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
        <textarea
          id="meal-memo"
          className="input min-h-24 resize-none"
          value={form.memo}
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </div>

      <div className={`grid gap-3 ${onDelete ? "grid-cols-2" : "grid-cols-1"}`}>
        {onDelete ? (
          <button type="button" className="button-secondary w-full" onClick={onDelete}>
            削除
          </button>
        ) : null}
        <button className="button-primary w-full disabled:opacity-50" type="submit" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
