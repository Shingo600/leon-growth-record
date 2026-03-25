"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/app-provider";
import { formatDateTime, getPendingReminderEvents } from "@/lib/utils";

const notifiedStorageKey = "leon-growth-record-notified-events";

function loadNotifiedEventIds() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(notifiedStorageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveNotifiedEventIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(notifiedStorageKey, JSON.stringify(ids));
}

export function NotificationCenter() {
  const { data, isReady } = useAppData();
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [notifiedEventIds, setNotifiedEventIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    setPermission(Notification.permission);
    setNotifiedEventIds(loadNotifiedEventIds());
  }, []);

  useEffect(() => {
    saveNotifiedEventIds(notifiedEventIds);
  }, [notifiedEventIds]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (permission !== "granted") {
      return;
    }

    const checkNotifications = () => {
      const dueEvents = getPendingReminderEvents(data.events, new Date(), notifiedEventIds);

      if (dueEvents.length === 0) {
        return;
      }

      dueEvents.forEach((event) => {
        const body = `${formatDateTime(event.date, event.time)} / ${event.type}${event.memo ? ` / ${event.memo}` : ""}`;
        new Notification(`レオン成長記録: ${event.title}`, {
          body,
          tag: event.id
        });
      });

      setNotifiedEventIds((current) => [...new Set([...current, ...dueEvents.map((event) => event.id)])]);
    };

    checkNotifications();
    const timerId = window.setInterval(checkNotifications, 30 * 1000);

    return () => window.clearInterval(timerId);
  }, [data.events, isReady, notifiedEventIds, permission]);

  const supported = mounted && typeof window !== "undefined" && "Notification" in window;
  const enabledCount = useMemo(() => data.events.filter((event) => event.notify).length, [data.events]);

  async function requestPermission() {
    if (!supported) {
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (!mounted || !supported) {
    return null;
  }

  return (
    <section className="card mb-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">予定通知</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            {permission === "granted"
              ? `通知は有効です。通知設定ありの予定は ${enabledCount} 件です。`
              : "ブラウザ通知を許可すると、予定時刻の前にお知らせできます。"}
          </p>
          <p className="mt-2 text-xs leading-5 text-ink/50">
            MVPではアプリを開いている間にブラウザ通知します。将来はバックグラウンド通知へ拡張できます。
          </p>
        </div>

        {permission !== "granted" ? (
          <button type="button" className="button-secondary shrink-0 px-4 py-2" onClick={requestPermission}>
            通知を許可
          </button>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            有効
          </span>
        )}
      </div>
    </section>
  );
}
