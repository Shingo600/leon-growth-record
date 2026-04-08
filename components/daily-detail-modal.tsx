"use client";

import { useState } from "react";
import { ActivitySummaryCard } from "@/components/activity-summary-card";
import { CalendarEventModal } from "@/components/calendar-event-modal";
import { HealthForm } from "@/components/health-form";
import { MealRecordModal } from "@/components/meal-record-modal";
import { ModalShell } from "@/components/modal-shell";
import { RecordForm } from "@/components/record-form";
import { useAppData } from "@/components/app-provider";
import { getDailyData } from "@/lib/daily";
import type { CalendarEvent, GrowthRecord, HealthRecord, MealRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function SectionHeader({
  title,
  actionLabel,
  onAction
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-base font-semibold">{title}</h4>
      {actionLabel && onAction ? (
        <button type="button" className="button-secondary px-4 py-2 text-sm" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function DailyDetailModal({
  date,
  onClose
}: {
  date: string | null;
  onClose: () => void;
}) {
  const { data, addRecord, updateRecord, deleteRecord, addHealthRecord, updateHealthRecord, deleteHealthRecord } =
    useAppData();
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  const [editingHealth, setEditingHealth] = useState<HealthRecord | null>(null);
  const [eventModalDate, setEventModalDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [mealModalDate, setMealModalDate] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [creatingHealth, setCreatingHealth] = useState(false);

  if (!date) {
    return null;
  }

  const daily = getDailyData(data, date);

  return (
    <>
      <ModalShell title={`${formatDate(date, { year: "numeric", month: "numeric", day: "numeric" })} の記録`} onClose={onClose} size="lg">
        <div className="space-y-5">
          <section className="rounded-3xl bg-cream p-4">
            <h4 className="text-base font-semibold">その日のサマリー</h4>
            {daily.record ? (
              <div className="mt-3 space-y-3">
                {daily.record.photoUrl ? (
                  <div className="overflow-hidden rounded-3xl bg-white">
                    <img src={daily.record.photoUrl} alt={`${date}の写真`} className="h-40 w-full object-cover" />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <p className="text-xs text-ink/55">体重</p>
                    <p className="mt-1 font-semibold">{daily.record.taijyuu.toFixed(1)}kg</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <p className="text-xs text-ink/55">食欲</p>
                    <p className="mt-1 font-semibold">{daily.record.appetite}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <p className="text-xs text-ink/55">元気度</p>
                    <p className="mt-1 font-semibold">{daily.record.energyLevel}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <p className="text-xs text-ink/55">うんち状態</p>
                    <p className="mt-1 font-semibold">{daily.record.poopCondition}</p>
                  </div>
                </div>
                <p className="rounded-2xl bg-white px-3 py-3 text-sm leading-6 text-ink/75">
                  {daily.record.memo || "メモはありません"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="button-secondary w-full" onClick={() => setEditingRecord(daily.record)}>
                    編集
                  </button>
                  <button
                    type="button"
                    className="button-secondary w-full"
                    onClick={() => {
                      if (window.confirm("この成長記録を削除しますか？")) {
                        deleteRecord(daily.record!.id);
                      }
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="rounded-2xl bg-white px-3 py-3 text-sm text-ink/65">成長記録はまだありません。</p>
                <button type="button" className="button-secondary w-full" onClick={() => setCreatingRecord(true)}>
                  成長記録を追加
                </button>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="ごはん" actionLabel="追加" onAction={() => setMealModalDate(date)} />
            {daily.meals.length > 0 ? (
              <div className="space-y-2">
                {daily.meals.map((meal) => {
                  const food = data.foodItems.find((item) => item.id === meal.foodItemId);
                  return (
                    <button
                      key={meal.id}
                      type="button"
                      className="w-full rounded-3xl bg-cream px-4 py-4 text-left"
                      onClick={() => setEditingMeal(meal)}
                    >
                      <p className="text-sm font-semibold">
                        {meal.mealType} {meal.time}
                      </p>
                      <p className="mt-1 text-sm text-ink/70">
                        {food?.productName ?? "フード未登録"} / {meal.grams}g / 食べ残し {meal.leftoverRate}%
                      </p>
                      {meal.memo ? <p className="mt-2 text-sm text-ink/65">{meal.memo}</p> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-3xl bg-cream px-4 py-4 text-sm text-ink/65">ごはん記録はまだありません。</p>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="活動" />
            <ActivitySummaryCard activityRecords={data.activityRecords} goals={data.profile.dailyGoals} today={date} />
          </section>

          <section className="space-y-3">
            <SectionHeader title="健康" actionLabel="追加" onAction={() => setCreatingHealth(true)} />
            {daily.healthRecords.length > 0 ? (
              <div className="space-y-2">
                {daily.healthRecords.map((record) => (
                  <div key={record.id} className="rounded-3xl bg-cream px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{record.title}</p>
                        <p className="mt-1 text-sm text-ink/65">{record.type} / {record.hospital || "病院名未入力"}</p>
                      </div>
                      <button type="button" className="button-secondary px-3 py-2 text-sm" onClick={() => setEditingHealth(record)}>
                        編集
                      </button>
                    </div>
                    {record.doctorNote ? <p className="mt-2 text-sm text-ink/65">{record.doctorNote}</p> : null}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-sm text-ink/55"
                        onClick={() => {
                          if (window.confirm("この健康履歴を削除しますか？")) {
                            deleteHealthRecord(record.id);
                          }
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-3xl bg-cream px-4 py-4 text-sm text-ink/65">健康履歴はまだありません。</p>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="予定" actionLabel="追加" onAction={() => setEventModalDate(date)} />
            {daily.events.length > 0 ? (
              <div className="space-y-2">
                {daily.events.map((event) => (
                  <div key={event.id} className="rounded-3xl bg-cream px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="mt-1 text-sm text-ink/65">
                          {event.time} / {event.type} / {event.notify ? "通知あり" : "通知なし"}
                        </p>
                      </div>
                      <button type="button" className="button-secondary px-3 py-2 text-sm" onClick={() => setEditingEvent(event)}>
                        編集
                      </button>
                    </div>
                    {event.memo ? <p className="mt-2 text-sm text-ink/65">{event.memo}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-3xl bg-cream px-4 py-4 text-sm text-ink/65">予定はまだありません。</p>
            )}
          </section>
        </div>
      </ModalShell>

      {creatingRecord ? (
        <ModalShell title="成長記録を追加" onClose={() => setCreatingRecord(false)}>
          <RecordForm
            initialDate={date}
            submitLabel="保存する"
            redirectOnSubmit={false}
            className="space-y-5"
            onSubmitRecord={(record) => {
              addRecord(record);
              setCreatingRecord(false);
            }}
          />
        </ModalShell>
      ) : null}

      {editingRecord ? (
        <ModalShell title="成長記録を編集" onClose={() => setEditingRecord(null)}>
          <RecordForm
            initialRecord={editingRecord}
            submitLabel="更新する"
            redirectOnSubmit={false}
            className="space-y-5"
            onSubmitRecord={(record) => {
              updateRecord(editingRecord.id, record);
              setEditingRecord(null);
            }}
          />
        </ModalShell>
      ) : null}

      {creatingHealth ? (
        <ModalShell title="健康履歴を追加" onClose={() => setCreatingHealth(false)}>
          <HealthForm
            initialDate={date}
            submitLabel="保存する"
            redirectOnSubmit={false}
            className="space-y-5"
            onSubmitRecord={(record) => {
              addHealthRecord(record);
              setCreatingHealth(false);
            }}
          />
        </ModalShell>
      ) : null}

      {editingHealth ? (
        <ModalShell title="健康履歴を編集" onClose={() => setEditingHealth(null)}>
          <HealthForm
            initialRecord={editingHealth}
            submitLabel="更新する"
            redirectOnSubmit={false}
            className="space-y-5"
            onSubmitRecord={(record) => {
              updateHealthRecord(editingHealth.id, record);
              setEditingHealth(null);
            }}
          />
        </ModalShell>
      ) : null}

      <CalendarEventModal
        selectedDate={eventModalDate}
        editingEvent={editingEvent}
        onClose={() => {
          setEventModalDate(null);
          setEditingEvent(null);
        }}
      />

      <MealRecordModal
        selectedDate={mealModalDate}
        editingRecord={editingMeal}
        onClose={() => {
          setMealModalDate(null);
          setEditingMeal(null);
        }}
      />
    </>
  );
}
