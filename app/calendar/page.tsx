"use client";

import { useMemo, useState } from "react";
import { CalendarEventModal } from "@/components/calendar-event-modal";
import { CalendarMonth } from "@/components/calendar-month";
import { DailyDetailModal } from "@/components/daily-detail-modal";
import { EmptyState } from "@/components/empty-state";
import { MonthlyTimelineList } from "@/components/monthly-timeline-list";
import { useAppData } from "@/components/app-provider";
import { buildMonthlyTimeline, getDailyData } from "@/lib/daily";
import { formatDate, getTodayDateString, getUpcomingEvents } from "@/lib/utils";

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
  const [panelDate, setPanelDate] = useState(() => getTodayDateString());
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(month),
    [month]
  );

  const monthlyTimeline = useMemo(() => buildMonthlyTimeline(data, month), [data, month]);
  const selectedDaily = useMemo(() => getDailyData(data, panelDate), [data, panelDate]);
  const upcomingEvents = getUpcomingEvents(data.events).slice(0, 3);
  const selectedMealGrams = selectedDaily.meals.reduce((sum, meal) => sum + meal.grams * (1 - meal.leftoverRate / 100), 0);

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
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">予定も記録も、日付を起点にまとめて振り返れます。</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">予定・カレンダー</h2>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={() => setEditingEventDate(getTodayDateString())}
        >
          予定を追加
        </button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex gap-2 rounded-2xl bg-cream p-1">
              <button
                type="button"
                className={`rounded-xl px-5 py-2.5 text-sm font-bold ${mode === "calendar" ? "bg-white text-indigo-700 shadow-sm" : "text-ink/60"}`}
                onClick={() => setMode("calendar")}
              >
                カレンダー
              </button>
              <button
                type="button"
                className={`rounded-xl px-5 py-2.5 text-sm font-bold ${mode === "list" ? "bg-white text-indigo-700 shadow-sm" : "text-ink/60"}`}
                onClick={() => setMode("list")}
              >
                一覧
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button-secondary px-4 py-2"
                onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <p className="min-w-32 text-center text-lg font-bold">{monthLabel}</p>
              <button
                type="button"
                className="button-secondary px-4 py-2"
                onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
          </div>

          {mode === "calendar" ? (
            <div className="space-y-3">
              <CalendarMonth
                currentMonth={month}
                events={data.events}
                markers={markers}
                onSelectDate={(date) => {
                  setPanelDate(date);
                  setSelectedDate(date);
                }}
                onSelectEvent={(event) => {
                  setPanelDate(event.date);
                  setSelectedDate(event.date);
                }}
              />
              <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-ink/60">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" />予定</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />ごはん</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />活動</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />健康</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" />体重</span>
              </div>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {listFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-bold ${listFilter === filter.key ? "bg-indigo-600 text-white" : "bg-white text-ink/70 ring-1 ring-line"}`}
                    onClick={() => setListFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {monthlyTimeline.length > 0 ? (
                <MonthlyTimelineList data={data} month={month} filter={listFilter} onSelectDate={(date) => {
                  setPanelDate(date);
                  setSelectedDate(date);
                }} />
              ) : (
                <EmptyState
                  title="この月の記録はまだありません"
                  description="日付を起点に記録がたまると、ここから自然に振り返れるようになります。"
                />
              )}
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="card space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold text-indigo-600">日付詳細</p>
              <h3 className="mt-1 text-2xl font-bold">{formatDate(panelDate, { year: "numeric", month: "numeric", day: "numeric", weekday: "short" })}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-sky-50 px-3 py-3">
                <p className="text-xs font-bold text-sky-700">体重</p>
                <p className="mt-1 text-lg font-bold">{selectedDaily.record ? `${selectedDaily.record.taijyuu.toFixed(1)}kg` : "未入力"}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 px-3 py-3">
                <p className="text-xs font-bold text-orange-700">ごはん</p>
                <p className="mt-1 text-lg font-bold">{selectedDaily.meals.length > 0 ? `${Math.round(selectedMealGrams)}g` : "未記録"}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold text-emerald-700">活動</p>
                <p className="mt-1 text-lg font-bold">{selectedDaily.activityRate}%</p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-3 py-3">
                <p className="text-xs font-bold text-rose-700">健康</p>
                <p className="mt-1 text-lg font-bold">{selectedDaily.healthRecords.length}件</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-indigo-50 px-3 py-3">
                <p className="text-xs font-bold text-indigo-700">予定</p>
                <p className="mt-1 text-lg font-bold">{selectedDaily.events.length}件</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold">この日の予定</p>
              {selectedDaily.events.length > 0 ? (
                selectedDaily.events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-left"
                    onClick={() => setSelectedDate(panelDate)}
                  >
                    <p className="text-sm font-bold">{event.time} {event.title}</p>
                    <p className="mt-1 text-xs text-ink/55">{event.type}</p>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/55">この日の予定はありません。</p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <button
                type="button"
                className="button-primary w-full px-3 py-2 text-sm"
                onClick={() => setEditingEventDate(panelDate)}
              >
                予定を追加
              </button>
              <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setSelectedDate(panelDate)}>
                記録を追加
              </button>
              <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setSelectedDate(panelDate)}>
                詳細を見る
              </button>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <p className="text-sm font-semibold text-indigo-600">今後の予定</p>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-left"
                  onClick={() => {
                    setPanelDate(event.date);
                    setSelectedDate(event.date);
                  }}
                >
                  <p className="text-sm font-bold">{event.date} {event.time}</p>
                  <p className="mt-1 text-sm text-ink/65">{event.title}</p>
                </button>
              ))
            ) : (
              <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/55">予定はまだありません。</p>
            )}
          </section>
        </aside>
      </section>

      <DailyDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />

      <CalendarEventModal
        selectedDate={editingEventDate}
        editingEvent={null}
        onClose={() => setEditingEventDate(null)}
      />
    </div>
  );
}
