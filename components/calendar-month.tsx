"use client";

import { useRef } from "react";
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
  const touchStartRef = useRef<Record<string, { x: number; y: number; moved: boolean }>>({});
  const suppressClickRef = useRef(false);
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
              style={{ touchAction: "pan-y" }}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                touchStartRef.current[day.key] = {
                  x: touch.clientX,
                  y: touch.clientY,
                  moved: false
                };
              }}
              onTouchMove={(event) => {
                const start = touchStartRef.current[day.key];
                if (!start) {
                  return;
                }

                const touch = event.touches[0];
                const movedX = Math.abs(touch.clientX - start.x);
                const movedY = Math.abs(touch.clientY - start.y);

                if (movedX > 8 || movedY > 8) {
                  start.moved = true;
                }
              }}
              onTouchEnd={() => {
                const start = touchStartRef.current[day.key];
                if (!start) {
                  return;
                }

                suppressClickRef.current = true;
                window.setTimeout(() => {
                  suppressClickRef.current = false;
                }, 300);

                if (!start.moved) {
                  onSelectDate(day.key);
                }

                delete touchStartRef.current[day.key];
              }}
              onClick={() => {
                if (suppressClickRef.current) {
                  return;
                }

                onSelectDate(day.key);
              }}
            >
              <p className="text-xs font-semibold">{day.date.getDate()}</p>
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
