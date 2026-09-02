"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { prepareImageForStorage } from "@/lib/image-client";
import { uploadSharedPhoto } from "@/lib/shared-photo";
import type { Appetite, EnergyLevel, GrowthRecord, PoopCondition } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

const appetiteOptions: Appetite[] = ["良い", "普通", "悪い"];
const energyOptions: EnergyLevel[] = ["元気", "普通", "元気なし"];
const poopOptions: PoopCondition[] = ["良い", "柔らかい", "下痢"];
const memoChips = ["よく食べた", "いつもより元気", "少し眠そう", "おなかの調子が気になる", "写真あり"];

const statusStyles = {
  selected: "border-ink bg-ink text-white shadow-[0_14px_24px_-20px_rgba(48,38,32,0.9)]",
  default: "border-sand bg-white text-ink hover:border-ink/30 hover:bg-cream"
};

function findPreviousRecord(records: GrowthRecord[], currentDate: string, currentId?: string) {
  return records.find((record) => record.id !== currentId && record.date <= currentDate);
}

function appendMemo(currentMemo: string, chip: string) {
  if (!currentMemo.trim()) {
    return chip;
  }

  if (currentMemo.includes(chip)) {
    return currentMemo;
  }

  return `${currentMemo}\n${chip}`;
}

type RecordFormProps = {
  initialRecord?: GrowthRecord;
  initialDate?: string;
  submitLabel?: string;
  onSubmitRecord?: (record: Omit<GrowthRecord, "id" | "createdAt">) => void;
  redirectOnSubmit?: boolean;
  className?: string;
};

export function RecordForm({
  initialRecord,
  initialDate,
  submitLabel = "保存する",
  onSubmitRecord,
  redirectOnSubmit = true,
  className = "card space-y-5 p-5"
}: RecordFormProps) {
  const router = useRouter();
  const { addRecord, data, storageMode } = useAppData();
  const initialDateKey = initialRecord?.date ?? initialDate ?? getTodayDateString();
  const initialPreviousRecord = findPreviousRecord(data.records, initialDateKey, initialRecord?.id);
  const [imageMessage, setImageMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: initialDateKey,
    taijyuu: String(initialRecord?.taijyuu ?? initialPreviousRecord?.taijyuu ?? data.profile.currentWeight ?? 0),
    appetite: initialRecord?.appetite ?? ("良い" as Appetite),
    energyLevel: initialRecord?.energyLevel ?? ("元気" as EnergyLevel),
    poopCondition: initialRecord?.poopCondition ?? ("良い" as PoopCondition),
    memo: initialRecord?.memo ?? "",
    photoUrl: initialRecord?.photoUrl ?? ""
  });
  const previousRecord = findPreviousRecord(data.records, form.date, initialRecord?.id);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const prepared = await prepareImageForStorage(file);
      setForm((current) => ({ ...current, photoUrl: prepared.dataUrl }));
      setSelectedFileName(prepared.fileName);
      setImageMessage(prepared.message);
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : "画像の読み込みに失敗しました。");
      setSelectedFileName("");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <form
      className={className}
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        let nextPhotoUrl = form.photoUrl;
        if (storageMode === "cloud" && form.photoUrl.startsWith("data:image/")) {
          try {
            nextPhotoUrl = await uploadSharedPhoto({
              dataUrl: form.photoUrl,
              fileName: selectedFileName || `record-${form.date}.jpg`,
              folder: "records"
            });
          } catch (error) {
            setImageMessage(error instanceof Error ? error.message : "写真共有のアップロードに失敗しました。");
            setIsSubmitting(false);
            return;
          }
        }

        const nextRecord = {
          ...form,
          photoUrl: nextPhotoUrl,
          taijyuu: Number(form.taijyuu)
        };

        if (onSubmitRecord) {
          onSubmitRecord(nextRecord);
        } else {
          addRecord(nextRecord);
        }

        if (redirectOnSubmit) {
          router.push("/records");
        }
        setIsSubmitting(false);
      }}
    >
      <div className="rounded-[1.75rem] border border-sand bg-gradient-to-br from-cream via-white to-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Growth log</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">今日の成長記録</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">体重と今日の様子を、タップ中心で手早く残せます。</p>
          </div>
          <div className="rounded-full bg-moss/10 px-4 py-2 text-sm font-semibold text-moss">
            {previousRecord ? "前回の体重を引き継ぎ済み" : "プロフィール体重を反映"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 ring-1 ring-sand">
            <p className="text-xs text-ink/50">日付</p>
            <input
              id="record-date"
              className="mt-2 w-full bg-transparent text-base font-semibold text-ink outline-none"
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              required
            />
          </div>
          <div className="rounded-3xl bg-white p-4 ring-1 ring-sand">
            <p className="text-xs text-ink/50">前回の体重</p>
            <p className="mt-2 text-base font-semibold text-ink">
              {previousRecord ? `${previousRecord.taijyuu}kg` : `${data.profile.currentWeight || 0}kg`}
            </p>
            <p className="mt-1 text-xs text-ink/45">{previousRecord ? previousRecord.date : "プロフィール"}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 ring-1 ring-sand">
            <p className="text-xs text-ink/50">今日の状態</p>
            <p className="mt-2 text-base font-semibold text-ink">
              {form.appetite} / {form.energyLevel} / {form.poopCondition}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-sand bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <label className="label mb-1" htmlFor="record-weight">
              体重
            </label>
            <p className="text-xs text-ink/50">前回値を入れているので、変わった時だけ直せばOKです。</p>
          </div>
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">kg</span>
        </div>
        <div className="relative">
          <input
            id="record-weight"
            className="input py-5 pr-14 text-center text-4xl font-bold tracking-tight"
            type="number"
            min="0"
            step="0.1"
            value={form.taijyuu}
            onChange={(event) => setForm((current) => ({ ...current, taijyuu: event.target.value }))}
            required
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/50">kg</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-sand bg-white">
        {[
          {
            id: "record-appetite",
            label: "食欲",
            value: form.appetite,
            options: appetiteOptions,
            onChange: (value: Appetite) => setForm((current) => ({ ...current, appetite: value }))
          },
          {
            id: "record-energy",
            label: "元気度",
            value: form.energyLevel,
            options: energyOptions,
            onChange: (value: EnergyLevel) => setForm((current) => ({ ...current, energyLevel: value }))
          },
          {
            id: "record-poop",
            label: "うんち状態",
            value: form.poopCondition,
            options: poopOptions,
            onChange: (value: PoopCondition) => setForm((current) => ({ ...current, poopCondition: value }))
          }
        ].map((group) => (
          <div key={group.id} className="border-b border-sand/70 p-4 last:border-b-0 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-ink" htmlFor={group.id}>
                {group.label}
              </label>
              <select
                id={group.id}
                className="sr-only"
                value={group.value}
                onChange={(event) => group.onChange(event.target.value as never)}
              >
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/60">{group.value}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`min-h-12 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    group.value === option ? statusStyles.selected : statusStyles.default
                  }`}
                  onClick={() => group.onChange(option as never)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-sand bg-white p-4 sm:p-5">
        <div className="mb-4">
          <label className="label mb-1" htmlFor="record-photo-file">
            写真を追加
          </label>
          <p className="text-xs leading-5 text-ink/50">今日のレオンの様子を残せます。スマホ写真は自動で軽くします。</p>
        </div>
        <label
          htmlFor="record-photo-file"
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sand bg-cream/70 px-4 py-6 text-center transition hover:border-ink/30 hover:bg-cream"
        >
          <span className="text-3xl">+</span>
          <span className="mt-2 text-sm font-semibold text-ink">写真を選ぶ</span>
          <span className="mt-1 text-xs text-ink/45">JPEG / PNG / HEIC</span>
        </label>
        <input id="record-photo-file" className="sr-only" type="file" accept="image/*,.heic,.heif" onChange={handleImageChange} />
        {selectedFileName ? <p className="mt-3 text-xs text-ink/60">選択中: {selectedFileName}</p> : null}
        {imageMessage ? <p className="mt-2 text-xs text-moss">{imageMessage}</p> : null}
        {form.photoUrl ? (
          <div className="mt-4 overflow-hidden rounded-3xl border border-sand bg-white">
            <img src={form.photoUrl} alt="記録写真のプレビュー" className="h-52 w-full object-cover" />
          </div>
        ) : null}
        <details className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
          <summary className="cursor-pointer font-semibold text-ink">URLで写真を入れる場合</summary>
          <input
            id="record-photo"
            className="input mt-3"
            type="text"
            placeholder="https://example.com/photo.jpg"
            value={form.photoUrl.startsWith("data:image/") ? "" : form.photoUrl}
            onChange={(event) => {
              setSelectedFileName("");
              setImageMessage("");
              setForm((current) => ({ ...current, photoUrl: event.target.value }));
            }}
          />
        </details>
      </section>

      <section className="rounded-[1.75rem] border border-sand bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="label mb-0" htmlFor="record-memo">
            メモ
          </label>
          <p className="text-xs text-ink/45">よく使うメモから選べます</p>
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {memoChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="shrink-0 rounded-full border border-sand bg-cream px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/30"
              onClick={() => setForm((current) => ({ ...current, memo: appendMemo(current.memo, chip) }))}
            >
              {chip}
            </button>
          ))}
        </div>
        <textarea
          id="record-memo"
          className="input min-h-32 resize-none"
          placeholder="今日の様子や気づいたことを自由にメモできます。"
          value={form.memo}
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </section>

      <button className="button-primary min-h-14 w-full text-base disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
