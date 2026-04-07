"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MealEntryForm } from "@/components/meal-entry-form";
import { useAppData } from "@/components/app-provider";
import type { FoodItem } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) {
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
            <h3 className="text-lg font-semibold">{title}</h3>
            <button type="button" className="button-secondary px-4 py-2" onClick={onClose}>
              閉じる
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function MealModal({ onClose, foodItems }: { onClose: () => void; foodItems: FoodItem[] }) {
  const { addMealRecord, data } = useAppData();

  return (
    <ModalShell title="ごはんを記録" onClose={onClose}>
      <MealEntryForm
        foodItems={foodItems}
        mealRecords={data.mealRecords}
        submitLabel="記録する"
        onSubmit={(draft) => {
          addMealRecord({
            date: getTodayDateString(),
            time: draft.time,
            mealType: draft.mealType,
            foodItemId: draft.foodItemId,
            grams: draft.grams,
            leftoverRate: draft.leftoverRate,
            memo: draft.memo
          });
          onClose();
        }}
      />
    </ModalShell>
  );
}

export function QuickAddActions({
  foodItems,
  todayRecordHref
}: {
  foodItems: FoodItem[];
  todayRecordHref: string;
}) {
  const [mode, setMode] = useState<"meal" | null>(null);

  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="text-sm text-ink/60">クイック入力</p>
        <h3 className="mt-1 text-xl font-semibold">すぐ記録する</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" className="button-primary w-full" onClick={() => setMode("meal")}>
          ごはんを記録
        </button>
        <Link href={todayRecordHref} className="button-secondary w-full">
          今日の記録を追加
        </Link>
      </div>

      {mode === "meal" ? <MealModal onClose={() => setMode(null)} foodItems={foodItems} /> : null}
    </section>
  );
}
