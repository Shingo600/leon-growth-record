"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "@/components/app-provider";
import { EventForm } from "@/components/event-form";
import { CalendarEvent } from "@/lib/types";

export function CalendarEventModal({
  selectedDate,
  editingEvent,
  onClose
}: {
  selectedDate?: string | null;
  editingEvent?: CalendarEvent | null;
  onClose: () => void;
}) {
  const { addEvent, updateEvent, deleteEvent } = useAppData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || (!selectedDate && !editingEvent)) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-ink/35" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center px-4 pb-6 pt-10 sm:items-center">
        <div
          className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-5 shadow-card"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{editingEvent ? "予定を編集" : "予定を追加"}</h3>
            <button type="button" className="button-secondary px-4 py-2" onClick={onClose}>
              閉じる
            </button>
          </div>

          <EventForm
            initialEvent={editingEvent ?? undefined}
            initialDate={selectedDate ?? editingEvent?.date}
            submitLabel={editingEvent ? "更新する" : "保存する"}
            redirectOnSubmit={false}
            className="space-y-5"
            onSubmitEvent={(event) => {
              if (editingEvent) {
                updateEvent(editingEvent.id, event);
              } else {
                addEvent(event);
              }
              onClose();
            }}
          />

          {editingEvent ? (
            <button
              type="button"
              className="button-secondary mt-4 w-full"
              onClick={() => {
                if (window.confirm("この予定を削除しますか？")) {
                  deleteEvent(editingEvent.id);
                  onClose();
                }
              }}
            >
              削除
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
