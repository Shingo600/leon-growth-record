"use client";

import { useMemo, useState } from "react";
import { CalendarEventModal } from "@/components/calendar-event-modal";
import { CalendarMonth } from "@/components/calendar-month";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/components/app-provider";
import { CalendarEvent, EventType } from "@/lib/types";

const eventTypeOptions: Array<EventType | "すべて"> = ["すべて", "散歩", "病院", "薬", "シャンプー", "その他"];
const notifyOptions = ["すべて", "通知あり", "通知なし"] as const;

export default function CalendarPage() {
  const { data } = useAppData();
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "すべて">("すべて");
  const [notifyFilter, setNotifyFilter] = useState<(typeof notifyOptions)[number]>("すべて");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(month),
    [month]
  );

  const filteredEvents = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return data.events.filter((event) => {
      const matchesKeyword =
        keyword.length === 0 ||
        event.title.toLowerCase().includes(keyword) ||
        event.memo.toLowerCase().includes(keyword) ||
        event.date.includes(keyword);

      const matchesType = typeFilter === "すべて" || event.type === typeFilter;
      const matchesNotify =
        notifyFilter === "すべて" ||
        (notifyFilter === "通知あり" && event.notify) ||
        (notifyFilter === "通知なし" && !event.notify);

      return matchesKeyword && matchesType && matchesNotify;
    });
  }, [data.events, notifyFilter, searchText, typeFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="カレンダー"
        description="予定を月表示と一覧表示の両方で確認できます。"
        action={
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              setEditingEvent(null);
              setSelectedDate(new Date().toISOString().slice(0, 10));
            }}
          >
            追加
          </button>
        }
      />

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

      <CalendarMonth
        currentMonth={month}
        events={data.events}
        onSelectDate={(date) => {
          setEditingEvent(null);
          setSelectedDate(date);
        }}
        onSelectEvent={(event) => {
          setSelectedDate(null);
          setEditingEvent(event);
        }}
      />

      <section className="card space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold">予定を絞り込み</h3>
          <p className="mt-1 text-sm text-ink/60">タイトル、種類、通知設定で見たい予定だけに絞れます。</p>
        </div>

        <input
          className="input"
          type="search"
          placeholder="タイトル・メモ・日付で検索"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as EventType | "すべて")}>
            {eventTypeOptions.map((option) => (
              <option key={option} value={option}>
                {`種類: ${option}`}
              </option>
            ))}
          </select>

          <select className="input" value={notifyFilter} onChange={(event) => setNotifyFilter(event.target.value as (typeof notifyOptions)[number])}>
            {notifyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="button-secondary w-full"
          onClick={() => {
            setSearchText("");
            setTypeFilter("すべて");
            setNotifyFilter("すべて");
          }}
        >
          条件をリセット
        </button>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">予定一覧</h3>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <EmptyState
            title={data.events.length > 0 ? "条件に合う予定がありません" : "予定がまだありません"}
            description={
              data.events.length > 0
                ? "検索条件や絞り込みを変えると表示される可能性があります。"
                : "カレンダーの日付をタップするか、右上の追加から予定を登録できます。"
            }
          />
        )}
      </section>

      <CalendarEventModal
        selectedDate={selectedDate}
        editingEvent={editingEvent}
        onClose={() => {
          setSelectedDate(null);
          setEditingEvent(null);
        }}
      />
    </div>
  );
}
