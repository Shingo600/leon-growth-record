"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { CalendarEvent, EventType } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

const eventTypes: EventType[] = ["散歩", "病院", "薬", "シャンプー", "その他"];
const reminderOptions = [
  { label: "予定時刻ちょうど", value: 0 },
  { label: "15分前", value: 15 },
  { label: "30分前", value: 30 },
  { label: "1時間前", value: 60 },
  { label: "前日", value: 60 * 24 }
];

type EventFormProps = {
  initialEvent?: CalendarEvent;
  submitLabel?: string;
  onSubmitEvent?: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
};

export function EventForm({
  initialEvent,
  submitLabel = "予定を保存",
  onSubmitEvent
}: EventFormProps) {
  const router = useRouter();
  const { addEvent } = useAppData();
  const [form, setForm] = useState({
    title: initialEvent?.title ?? "",
    date: initialEvent?.date ?? getTodayDateString(),
    time: initialEvent?.time ?? "09:00",
    type: initialEvent?.type ?? ("散歩" as EventType),
    notify: initialEvent?.notify ?? true,
    reminderMinutes: initialEvent?.reminderMinutes ?? 30,
    memo: initialEvent?.memo ?? ""
  });

  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmitEvent) {
          onSubmitEvent(form);
        } else {
          addEvent(form);
        }
        router.push("/calendar");
      }}
    >
      <div>
        <label className="label" htmlFor="event-title">タイトル</label>
        <input
          id="event-title"
          className="input"
          type="text"
          placeholder="病院の定期検診"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="event-date">日付</label>
        <input
          id="event-date"
          className="input date-input"
          type="date"
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="event-time">時間</label>
        <input
          id="event-time"
          className="input time-input"
          type="time"
          value={form.time}
          onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="event-type">種類</label>
        <select
          id="event-type"
          className="input"
          value={form.type}
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as EventType }))}
        >
          {eventTypes.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={form.notify}
          onChange={(event) => setForm((current) => ({ ...current, notify: event.target.checked }))}
        />
        通知する
      </label>

      <div>
        <label className="label" htmlFor="event-reminder">通知タイミング</label>
        <select
          id="event-reminder"
          className="input"
          value={String(form.reminderMinutes)}
          onChange={(event) =>
            setForm((current) => ({ ...current, reminderMinutes: Number(event.target.value) }))
          }
          disabled={!form.notify}
        >
          {reminderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-5 text-ink/55">
          通知を有効にしたときだけ、リマインド時刻を保存します。
        </p>
      </div>

      <div>
        <label className="label" htmlFor="event-memo">メモ</label>
        <textarea
          id="event-memo"
          className="input min-h-28 resize-none"
          placeholder="持ち物や補足を記録"
          value={form.memo}
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </div>

      <button className="button-primary w-full" type="submit">{submitLabel}</button>
    </form>
  );
}
