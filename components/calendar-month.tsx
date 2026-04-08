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

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-sand/70 bg-cream/60 px-2 py-3 text-center text-xs font-medium text-ink/55">
        {weekLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-sand/40">
        {days.map((day) => {
          const dayEvents = events.filter((event) => event.date === day.key);
          const dayMarker = markers[day.key];

          return (
            <div
              key={day.key}
              className={`min-h-28 bg-white p-2 text-left align-top ${
                day.isCurrentMonth ? "" : "bg-white/55 text-ink/35"
              }`}
            >
              <button
                type="button"
                className="rounded-lg px-1 py-0.5 text-xs font-semibold transition hover:bg-cream/70"
                onClick={() => onSelectDate(day.key)}
              >
                {day.date.getDate()}
              </button>

              {dayMarker ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {dayMarker.hasRecord ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}
                  {dayMarker.hasMeal ? <span className="h-2 w-2 rounded-full bg-amber-300" /> : null}
                  {dayMarker.hasActivity ? <span className="h-2 w-2 rounded-full bg-emerald-300" /> : null}
                  {dayMarker.hasHealth ? <span className="h-2 w-2 rounded-full bg-sky-300" /> : null}
                  {dayMarker.hasEvent ? <span className="h-2 w-2 rounded-full bg-rose-300" /> : null}
                </div>
              ) : null}

              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`block w-full rounded-xl px-2 py-1 text-left text-[10px] font-medium ${getEventTypeClassName(
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
