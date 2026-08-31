"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppData } from "@/components/app-provider";
import { buildActivityItems } from "@/lib/activity";
import type { FoodItem, MealRecord, MealType } from "@/lib/types";
import { sortMealRecords } from "@/lib/utils";

type DailyEasyCheckCardProps = {
  today: string;
  todayRecordHref: string;
};

type EasyAction = {
  key: string;
  label: string;
  status: string;
  done: boolean;
  onClick?: () => void;
  href?: string;
};

function getNowTimeString() {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

function getDefaultMealTime(mealType: MealType) {
  const fallbackTimes: Record<MealType, string> = {
    朝: "07:00",
    昼: "12:00",
    夜: "18:30",
    おやつ: getNowTimeString()
  };

  return fallbackTimes[mealType];
}

function findLatestMealByType(mealRecords: MealRecord[], mealType: MealType) {
  return sortMealRecords(mealRecords.filter((record) => record.mealType === mealType))[0];
}

function getRecommendedGrams(foodItem: FoodItem | undefined, mealType: MealType) {
  if (!foodItem) {
    return 0;
  }

  return foodItem.mealRecommendations?.[mealType] ?? foodItem.servingSize ?? 0;
}

export function DailyEasyCheckCard({ today, todayRecordHref }: DailyEasyCheckCardProps) {
  const {
    addMealRecord,
    addRecord,
    data,
    incrementActivity,
    updateRecord
  } = useAppData();

  const todayRecord = data.records.find((record) => record.date === today);
  const todayMeals = data.mealRecords.filter((record) => record.date === today);
  const activityItems = useMemo(
    () => buildActivityItems(data.activityRecords, data.profile.dailyGoals, today),
    [data.activityRecords, data.profile.dailyGoals, today]
  );

  const walk = activityItems.find((item) => item.key === "walk");
  const intelligence = activityItems.find((item) => item.key === "intelligence");
  const training = activityItems.find((item) => item.key === "training");

  function addUsualMeal(mealType: MealType) {
    if (todayMeals.some((meal) => meal.mealType === mealType)) {
      return;
    }

    const latest = findLatestMealByType(data.mealRecords, mealType);
    const foodItem = data.foodItems.find((food) => food.id === latest?.foodItemId) ?? data.foodItems[0];

    if (!foodItem) {
      return;
    }

    addMealRecord({
      date: today,
      time: latest?.time || getDefaultMealTime(mealType),
      mealType,
      foodItemId: foodItem.id,
      grams: latest?.grams ?? getRecommendedGrams(foodItem, mealType),
      leftoverRate: latest?.leftoverRate ?? 0,
      memo: latest?.memo ?? ""
    });
  }

  function upsertTodayCondition(next: { energyLevel?: "元気"; poopCondition?: "良い" }) {
    const base = {
      date: today,
      taijyuu: data.profile.currentWeight,
      appetite: "良い" as const,
      energyLevel: "元気" as const,
      poopCondition: "良い" as const,
      memo: "",
      photoUrl: ""
    };

    if (todayRecord) {
      updateRecord(todayRecord.id, {
        ...todayRecord,
        ...next
      });
      return;
    }

    addRecord({
      ...base,
      ...next
    });
  }

  const actions: EasyAction[] = [
    {
      key: "weight",
      label: "今日の体重",
      status: todayRecord ? `${todayRecord.taijyuu}kg` : "あとでOK",
      done: Boolean(todayRecord),
      href: todayRecordHref
    },
    {
      key: "breakfast",
      label: "朝ごはん",
      status: todayMeals.some((meal) => meal.mealType === "朝") ? "記録済み" : "いつもの朝",
      done: todayMeals.some((meal) => meal.mealType === "朝"),
      onClick: () => addUsualMeal("朝")
    },
    {
      key: "dinner",
      label: "夜ごはん",
      status: todayMeals.some((meal) => meal.mealType === "夜") ? "記録済み" : "いつもの夜",
      done: todayMeals.some((meal) => meal.mealType === "夜"),
      onClick: () => addUsualMeal("夜")
    },
    {
      key: "walk",
      label: "散歩",
      status: walk?.status === "達成" ? "達成" : "+10分",
      done: walk?.status === "達成",
      onClick: () => walk && incrementActivity(today, walk.category, walk.quickKind, 10)
    },
    {
      key: "intelligence",
      label: "知育",
      status: intelligence?.status === "達成" ? "達成" : "+10分",
      done: intelligence?.status === "達成",
      onClick: () => intelligence && incrementActivity(today, intelligence.category, intelligence.quickKind, 10)
    },
    {
      key: "training",
      label: "トレーニング",
      status: training?.status === "達成" ? "達成" : "+10分",
      done: training?.status === "達成",
      onClick: () => training && incrementActivity(today, training.category, training.quickKind, 10)
    },
    {
      key: "energy",
      label: "元気",
      status: todayRecord?.energyLevel === "元気" ? "記録済み" : "元気",
      done: todayRecord?.energyLevel === "元気",
      onClick: () => upsertTodayCondition({ energyLevel: "元気" })
    },
    {
      key: "poop",
      label: "うんち",
      status: todayRecord?.poopCondition === "良い" ? "記録済み" : "良い",
      done: todayRecord?.poopCondition === "良い",
      onClick: () => upsertTodayCondition({ poopCondition: "良い" })
    }
  ];

  const completedCount = actions.filter((action) => action.done).length;
  const message =
    completedCount === actions.length
      ? "今日は十分。あとは写真やメモだけでもOKです。"
      : completedCount >= 4
        ? "いいペースです。残りは気づいた時に少しだけ。"
        : "全部やらなくて大丈夫。まず1つ押せば今日の記録になります。";

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">今日のかんたん記録</p>
          <h3 className="mt-1 text-xl font-semibold">1つ押すだけでもOK</h3>
          <p className="mt-2 text-sm leading-6 text-ink/65">{message}</p>
        </div>
        <div className="shrink-0 rounded-3xl bg-cream px-4 py-3 text-center">
          <p className="text-xs text-ink/55">入力済み</p>
          <p className="text-2xl font-semibold">
            {completedCount}
            <span className="text-sm text-ink/50">/{actions.length}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const className = `flex min-h-[64px] w-full flex-col items-start justify-center rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
            action.done ? "border-transparent bg-ink text-white" : "border-line bg-cream text-ink hover:bg-white"
          }`;

          const content = (
            <>
              <span className="text-sm font-semibold">{action.label}</span>
              <span className={`mt-1 text-xs ${action.done ? "text-white/75" : "text-ink/55"}`}>{action.status}</span>
            </>
          );

          if (action.href) {
            return (
              <Link key={action.key} href={action.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button key={action.key} type="button" className={className} onClick={action.onClick} disabled={action.done}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
