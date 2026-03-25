"use client";

import { CalendarEvent } from "@/lib/types";
import { buildMonthMatrix, getEventTypeClassName } from "@/lib/utils";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarMonth({
  currentMonth,
  events
}: {
  currentMonth: Date;
  events: CalendarEvent[];
}) {
  const days = buildMonthMatrix(currentMonth);

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-sand/70 bg-cream/60 px-2 py-3 text-center text-xs font-medium text-ink/55">
        {weekLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-sand/40">
        {days.map((day) => {
          // 1日ごとの予定件数がすぐ分かるように、月表示でも簡易一覧を出しています。
          const dayEvents = events.filter((event) => event.date === day.key);
          return (
            <div
              key={day.key}
              className={`min-h-28 bg-white p-2 ${day.isCurrentMonth ? "" : "bg-white/55 text-ink/35"}`}
            >
              <p className="text-xs font-semibold">{day.date.getDate()}</p>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-xl px-2 py-1 text-[10px] font-medium ${getEventTypeClassName(event.type)}`}
                  >
                    {event.time} {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <div className="text-[10px] text-ink/55">+{dayEvents.length - 2}件</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
