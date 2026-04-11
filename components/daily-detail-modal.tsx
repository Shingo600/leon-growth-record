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

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <p className="text-xs text-ink/55">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink/85">{value}</p>
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
  const {
    data,
    addRecord,
    updateRecord,
    deleteRecord,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord
  } = useAppData();
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  const [editingHealth, setEditingHealth] = useState<HealthRecord | null>(null);
  const [eventModalDate, setEventModalDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [mealModalDate, setMealModalDate] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [creatingHealth, setCreatingHealth] = useState(false);
  const safeDate = date ?? "";
  const daily = getDailyData(data, safeDate);
  const totalMealGrams = daily.meals.reduce((sum, meal) => sum + meal.grams * (1 - meal.leftoverRate / 100), 0);
  const activeItems = daily.activityItems.filter((item) => item.current > 0);
  const summaryLine = daily.record
    ? `${daily.record.energyLevel} / 食欲 ${daily.record.appetite} / 活動達成率 ${daily.activityRate}%`
    : daily.meals.length || activeItems.length || daily.events.length || daily.healthRecords.length
      ? `ごはん ${daily.meals.length}件 / 活動 ${daily.activityRate}% / 健康 ${daily.healthRecords.length}件 / 予定 ${daily.events.length}件`
      : "この日はまだ記録がありません。";

  if (!date) {
    return null;
  }

  return (
    <>
      <ModalShell title={`${formatDate(date, { year: "numeric", month: "numeric", day: "numeric" })} の記録`} onClose={onClose} size="lg">
        <div className="space-y-5">
          <section className="rounded-[2rem] bg-cream p-4">
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-white">
                <img
                  src={daily.record?.photoUrl || data.profile.photoUrl || "/placeholder-dog.svg"}
                  alt={`${date}の写真`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink/60">1日のふり返り</p>
                <h4 className="mt-1 text-xl font-semibold">{formatDate(date, { month: "numeric", day: "numeric", weekday: "short" })}</h4>
                <p className="mt-2 rounded-2xl bg-white px-3 py-3 text-sm leading-6 text-ink/75">{summaryLine}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryChip label="体重" value={daily.record ? `${daily.record.taijyuu.toFixed(1)}kg` : "未入力"} />
              <SummaryChip label="ごはん" value={daily.meals.length > 0 ? `${Math.round(totalMealGrams)}g` : "未記録"} />
              <SummaryChip label="活動" value={`${daily.activityRate}%`} />
              <SummaryChip label="予定 / 健康" value={`${daily.events.length} / ${daily.healthRecords.length}`} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setCreatingRecord(true)}>
                成長記録を追加
              </button>
              <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setMealModalDate(date)}>
                ごはんを追加
              </button>
              <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setCreatingHealth(true)}>
                健康を追加
              </button>
              <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setEventModalDate(date)}>
                予定を追加
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-cream p-4">
            <SectionHeader title="その日のサマリー" actionLabel={daily.record ? "編集" : "追加"} onAction={() => (daily.record ? setEditingRecord(daily.record) : setCreatingRecord(true))} />
            {daily.record ? (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <SummaryChip label="体重" value={`${daily.record.taijyuu.toFixed(1)}kg`} />
                  <SummaryChip label="食欲" value={daily.record.appetite} />
                  <SummaryChip label="元気度" value={daily.record.energyLevel} />
                  <SummaryChip label="うんち状態" value={daily.record.poopCondition} />
                </div>
                <p className="rounded-2xl bg-white px-3 py-3 text-sm leading-6 text-ink/75">{daily.record.memo || "メモはありません"}</p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-ink/55"
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
              <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm text-ink/65">成長記録はまだありません。</p>
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
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">
                          {meal.mealType} {meal.time}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink/65">
                          {meal.leftoverRate === 0 ? "完食" : `${meal.leftoverRate}%残し`}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink/70">{food?.productName ?? "フード未登録"} / {meal.grams}g</p>
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
                    {record.nextDueDate ? <p className="mt-2 text-sm text-ink/55">次回予定日: {formatDate(record.nextDueDate)}</p> : null}
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
