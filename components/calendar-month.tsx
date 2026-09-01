"use client";

import type { CalendarEvent } from "@/lib/types";
import { buildMonthMatrix, getEventTypeClassName } from "@/lib/utils";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

type DailyMarker = {
  hasRecord: boolean;
  hasMeal: boolean;
  hasActivity: boolean;
  hasHealth: boolean;
  hasEvent: boolean;
};

const markerItems = [
  { key: "hasEvent", label: "予定", className: "bg-indigo-500" },
  { key: "hasMeal", label: "ごはん", className: "bg-orange-400" },
  { key: "hasActivity", label: "活動", className: "bg-emerald-500" },
  { key: "hasHealth", label: "健康", className: "bg-rose-400" },
  { key: "hasRecord", label: "体重", className: "bg-sky-500" }
] as const;

export function CalendarMonth({
  currentMonth,
  events,
  markers,
  onSelectDate,
  onSelectEvent
}: {
  currentMonth: Date;
  events: CalendarEvent[];
  markers: Record<string, DailyMarker>;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const days = buildMonthMatrix(currentMonth);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line bg-cream/50 px-2 py-3 text-center text-xs font-bold text-ink/55">
        {weekLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-line">
        {days.map((day) => {
          const dayEvents = events.filter((event) => event.date === day.key);
          const dayMarker = markers[day.key];
          const isToday = day.key === todayKey;

          return (
            <div
              key={day.key}
              className={`min-h-24 bg-white p-2 text-left align-top md:min-h-28 ${
                day.isCurrentMonth ? "" : "bg-white/60 text-ink/35"
              }`}
            >
              <button
                type="button"
                className={`grid h-8 w-8 place-items-center rounded-xl text-sm font-bold transition hover:bg-indigo-50 ${
                  isToday ? "bg-indigo-600 text-white shadow-[0_12px_24px_-16px_rgba(79,70,229,0.9)]" : ""
                }`}
                onClick={() => onSelectDate(day.key)}
              >
                {day.date.getDate()}
              </button>

              {dayMarker ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {markerItems.map((marker) =>
                    dayMarker[marker.key] ? (
                      <span key={marker.key} className={`h-2 w-2 rounded-full ${marker.className}`} title={marker.label} />
                    ) : null
                  )}
                </div>
              ) : null}

              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`block w-full rounded-xl px-2 py-1 text-left text-[10px] font-bold ${getEventTypeClassName(
                      event.type
                    )}`}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onSelectEvent(event);
                    }}
                  >
                    {event.time} {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 ? (
                  <button
                    type="button"
                    className="text-[10px] text-ink/55"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onSelectDate(day.key);
                    }}
                  >
                    +{dayEvents.length - 2}件
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
