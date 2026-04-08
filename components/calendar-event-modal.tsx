"use client";

import { useAppData } from "@/components/app-provider";
import { EventForm } from "@/components/event-form";
import { ModalShell } from "@/components/modal-shell";
import type { CalendarEvent } from "@/lib/types";

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
  const isOpen = Boolean(selectedDate || editingEvent);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell title={editingEvent ? "予定を編集" : "予定を追加"} onClose={onClose}>
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
    </ModalShell>
  );
}
