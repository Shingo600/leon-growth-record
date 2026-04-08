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
          className="card w-full space-y-3 p-5 text-left transition hover:bg-white"
          onClick={() => onSelectDate(item.date)}
        >
          <p className="text-lg font-semibold">
            {formatDate(item.date, { year: "numeric", month: "numeric", day: "numeric" })}
          </p>

          {item.record ? (
            <p className="text-sm text-ink/75">
              体重 {item.record.taijyuu.toFixed(1)}kg / 食欲 {item.record.appetite} / 元気 {item.record.energyLevel}
            </p>
          ) : null}

          {item.meals.length > 0 ? (
            <p className="text-sm text-ink/75">
              ごはん:{" "}
              {item.meals
                .slice(0, 3)
                .map((meal) => `${meal.mealType}${meal.grams}g`)
                .join(" / ")}
            </p>
          ) : null}

          {item.activityItems.some((activity) => activity.current > 0) ? (
            <p className="text-sm text-ink/75">
              活動:{" "}
              {item.activityItems
                .filter((activity) => activity.current > 0)
                .map((activity) => `${activity.label}${activity.current}分`)
                .join(" / ")}
            </p>
          ) : null}

          {item.healthRecords.length > 0 ? (
            <p className="text-sm text-ink/75">
              健康: {item.healthRecords.slice(0, 2).map((record) => `${record.type} ${record.title}`).join(" / ")}
            </p>
          ) : null}

          {item.events.length > 0 ? (
            <p className="text-sm text-ink/75">
              予定: {item.events.slice(0, 2).map((event) => `${event.time} ${event.title}`).join(" / ")}
            </p>
          ) : null}
        </button>
      ))}
    </div>
  );
}
