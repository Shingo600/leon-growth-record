"use client";

import { CalendarEvent } from "@/lib/types";
import { buildMonthMatrix, getEventTypeClassName } from "@/lib/utils";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarMonth({
  currentMonth,
  events,
  onSelectDate,
  onSelectEvent
}: {
  currentMonth: Date;
  events: CalendarEvent[];
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

          return (
            <div
              key={day.key}
              className={`min-h-28 bg-white p-2 text-left align-top transition hover:bg-cream/30 ${
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
                      onSelectEvent(dayEvents[0]);
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
