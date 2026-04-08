"use client";

import { useMemo, useState } from "react";
import { CalendarEventModal } from "@/components/calendar-event-modal";
import { CalendarMonth } from "@/components/calendar-month";
import { DailyDetailModal } from "@/components/daily-detail-modal";
import { EmptyState } from "@/components/empty-state";
import { MonthlyTimelineList } from "@/components/monthly-timeline-list";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/components/app-provider";
import { buildMonthlyTimeline } from "@/lib/daily";

const listFilters = [
  { key: "all", label: "すべて" },
  { key: "record", label: "成長記録" },
  { key: "meal", label: "ごはん" },
  { key: "activity", label: "活動" },
  { key: "health", label: "健康" },
  { key: "event", label: "予定" }
] as const;

export default function CalendarPage() {
  const { data } = useAppData();
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [listFilter, setListFilter] = useState<(typeof listFilters)[number]["key"]>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEventDate, setEditingEventDate] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(month),
    [month]
  );

  const monthlyTimeline = useMemo(() => buildMonthlyTimeline(data, month), [data, month]);

  const markers = useMemo(
    () =>
      Object.fromEntries(
        monthlyTimeline.map((item) => [
          item.date,
          {
            hasRecord: Boolean(item.record),
            hasMeal: item.meals.length > 0,
            hasActivity: item.activityItems.some((activity) => activity.current > 0),
            hasHealth: item.healthRecords.length > 0,
            hasEvent: item.events.length > 0
          }
        ])
      ),
    [monthlyTimeline]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="カレンダー"
        description="予定も記録も、日付を起点にまとめて振り返れます。"
        action={
          <button
            type="button"
            className="button-primary"
            onClick={() => setEditingEventDate(new Date().toISOString().slice(0, 10))}
          >
            追加
          </button>
        }
      />

      <div className="card flex gap-2 p-2">
        <button
          type="button"
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${mode === "calendar" ? "bg-ink text-white" : "bg-cream text-ink/70"}`}
          onClick={() => setMode("calendar")}
        >
          カレンダー
        </button>
        <button
          type="button"
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium ${mode === "list" ? "bg-ink text-white" : "bg-cream text-ink/70"}`}
          onClick={() => setMode("list")}
        >
          一覧
        </button>
      </div>

      <div className="card flex items-center justify-between p-4">
        <button
          type="button"
          className="button-secondary px-4 py-2"
          onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
        >
          前月
        </button>
        <p className="font-semibold">{monthLabel}</p>
        <button
          type="button"
          className="button-secondary px-4 py-2"
          onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
        >
          次月
        </button>
      </div>

      {mode === "calendar" ? (
        <CalendarMonth
          currentMonth={month}
          events={data.events}
          markers={markers}
          onSelectDate={setSelectedDate}
          onSelectEvent={(event) => setSelectedDate(event.date)}
        />
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {listFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${listFilter === filter.key ? "bg-ink text-white" : "bg-cream text-ink/70"}`}
                onClick={() => setListFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {monthlyTimeline.length > 0 ? (
            <MonthlyTimelineList data={data} month={month} filter={listFilter} onSelectDate={setSelectedDate} />
          ) : (
            <EmptyState
              title="この月の記録はまだありません"
              description="日付を起点に記録がたまると、ここから自然に振り返れるようになります。"
            />
          )}
        </section>
      )}

      <DailyDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />

      <CalendarEventModal
        selectedDate={editingEventDate}
        editingEvent={null}
        onClose={() => setEditingEventDate(null)}
      />
    </div>
  );
}
