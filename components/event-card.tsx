"use client";

import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { CalendarEvent } from "@/lib/types";
import { formatDateTime, getEventTypeClassName } from "@/lib/utils";

function formatReminder(minutes: number) {
  if (minutes === 0) {
    return "予定時刻";
  }

  if (minutes === 60 * 24) {
    return "前日";
  }

  if (minutes >= 60) {
    return `${minutes / 60}時間前`;
  }

  return `${minutes}分前`;
}

export function EventCard({ event }: { event: CalendarEvent }) {
  const { deleteEvent } = useAppData();

  function handleDelete() {
    const confirmed = window.confirm("この予定を削除しますか？");
    if (!confirmed) {
      return;
    }

    deleteEvent(event.id);
  }

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{event.title}</p>
          <p className="mt-1 text-sm text-ink/60">{formatDateTime(event.date, event.time)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getEventTypeClassName(event.type)}`}>
          {event.type}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-ink/75">{event.memo || "メモはありません"}</p>
      <p className="mt-3 text-xs text-ink/55">
        通知: {event.notify ? `あり (${formatReminder(event.reminderMinutes)})` : "なし"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href={`/events/${event.id}/edit`} className="button-secondary w-full">
          編集
        </Link>
        <button type="button" className="button-secondary w-full" onClick={handleDelete}>
          削除
        </button>
      </div>
    </article>
  );
}
