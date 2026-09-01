"use client";

import { buildMonthlyTimeline } from "@/lib/daily";
import type { AppData } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type FilterType = "all" | "record" | "meal" | "activity" | "health" | "event";

function matchesFilter(item: ReturnType<typeof buildMonthlyTimeline>[number], filter: FilterType) {
  switch (filter) {
    case "record":
      return Boolean(item.record);
    case "meal":
      return item.meals.length > 0;
    case "activity":
      return item.activityItems.some((activity) => activity.current > 0);
    case "health":
      return item.healthRecords.length > 0;
    case "event":
      return item.events.length > 0;
    default:
      return true;
  }
}

export function MonthlyTimelineList({
  data,
  month,
  filter,
  onSelectDate
}: {
  data: AppData;
  month: Date;
  filter: FilterType;
  onSelectDate: (date: string) => void;
}) {
  const items = buildMonthlyTimeline(data, month).filter((item) => matchesFilter(item, filter));

  if (items.length === 0) {
    return <p className="rounded-3xl bg-cream px-4 py-4 text-sm text-ink/65">この条件では表示できる記録がありません。</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <button
          key={item.date}
          type="button"
          className="w-full rounded-3xl border border-line bg-white p-4 text-left shadow-[0_12px_30px_-28px_rgba(47,42,37,0.55)] transition hover:-translate-y-0.5 hover:shadow-card"
          onClick={() => onSelectDate(item.date)}
        >
          <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
            <div>
              <p className="text-lg font-bold">
                {formatDate(item.date, { year: "numeric", month: "numeric", day: "numeric", weekday: "short" })}
              </p>
              <p className="mt-1 text-xs font-semibold text-indigo-600">詳細を見る</p>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-2xl bg-sky-50 px-3 py-3">
                <p className="text-xs font-bold text-sky-700">体重</p>
                <p className="mt-1 text-sm font-semibold text-ink/75">{item.record ? `${item.record.taijyuu.toFixed(1)}kg` : "なし"}</p>
              </div>

              <div className="rounded-2xl bg-orange-50 px-3 py-3">
                <p className="text-xs font-bold text-orange-700">ごはん</p>
                <p className="mt-1 text-sm font-semibold text-ink/75">
                  {item.meals.length > 0
                    ? item.meals.slice(0, 2).map((meal) => `${meal.mealType}${meal.grams}g`).join(" / ")
                    : "なし"}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold text-emerald-700">活動</p>
                <p className="mt-1 text-sm font-semibold text-ink/75">
                  {item.activityItems.some((activity) => activity.current > 0)
                    ? item.activityItems.filter((activity) => activity.current > 0).slice(0, 2).map((activity) => `${activity.label}${activity.current}分`).join(" / ")
                    : "なし"}
                </p>
              </div>

              <div className="rounded-2xl bg-rose-50 px-3 py-3">
                <p className="text-xs font-bold text-rose-700">健康</p>
                <p className="mt-1 text-sm font-semibold text-ink/75">
                  {item.healthRecords.length > 0 ? item.healthRecords.slice(0, 1).map((record) => record.title).join(" / ") : "なし"}
                </p>
              </div>

              <div className="rounded-2xl bg-indigo-50 px-3 py-3">
                <p className="text-xs font-bold text-indigo-700">予定</p>
                <p className="mt-1 text-sm font-semibold text-ink/75">
                  {item.events.length > 0 ? item.events.slice(0, 1).map((event) => `${event.time} ${event.title}`).join(" / ") : "なし"}
                </p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
