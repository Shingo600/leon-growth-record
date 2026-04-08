"use client";

import { useAppData } from "@/components/app-provider";
import { MealEntryForm } from "@/components/meal-entry-form";
import { ModalShell } from "@/components/modal-shell";
import type { MealRecord } from "@/lib/types";

export function MealRecordModal({
  selectedDate,
  editingRecord,
  onClose
}: {
  selectedDate: string | null;
  editingRecord?: MealRecord | null;
  onClose: () => void;
}) {
  const { data, addMealRecord, updateMealRecord, deleteMealRecord } = useAppData();
  if (!selectedDate && !editingRecord) {
    return null;
  }

  const targetDate = selectedDate ?? editingRecord?.date ?? null;
  if (!targetDate) {
    return null;
  }

  return (
    <ModalShell title={editingRecord ? "ごはん記録を編集" : "ごはん記録を追加"} onClose={onClose}>
      <MealEntryForm
        foodItems={data.foodItems}
        mealRecords={data.mealRecords.filter((item) => item.id !== editingRecord?.id)}
        initialValue={
          editingRecord
            ? {
                mealType: editingRecord.mealType,
                foodItemId: editingRecord.foodItemId,
                grams: `${editingRecord.grams}`,
                time: editingRecord.time,
                leftoverRate: `${editingRecord.leftoverRate}`,
                memo: editingRecord.memo
              }
            : undefined
        }
        submitLabel={editingRecord ? "更新する" : "保存する"}
        onDelete={
          editingRecord
            ? () => {
                if (window.confirm("このごはん記録を削除しますか？")) {
                  deleteMealRecord(editingRecord.id);
                  onClose();
                }
              }
            : undefined
        }
        onSubmit={(draft) => {
          const payload = {
            date: targetDate,
            time: draft.time,
            mealType: draft.mealType,
            foodItemId: draft.foodItemId,
            grams: draft.grams,
            leftoverRate: draft.leftoverRate,
            memo: draft.memo
          };

          if (editingRecord) {
            updateMealRecord(editingRecord.id, payload);
          } else {
            addMealRecord(payload);
          }
          onClose();
        }}
      />
    </ModalShell>
  );
}
