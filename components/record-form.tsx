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
  const { addRecord, storageMode } = useAppData();
  const [imageMessage, setImageMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: initialRecord?.date ?? initialDate ?? getTodayDateString(),
    taijyuu: String(initialRecord?.taijyuu ?? "0"),
    appetite: initialRecord?.appetite ?? ("良い" as Appetite),
    energyLevel: initialRecord?.energyLevel ?? ("元気" as EnergyLevel),
    poopCondition: initialRecord?.poopCondition ?? ("良い" as PoopCondition),
    memo: initialRecord?.memo ?? "",
    photoUrl: initialRecord?.photoUrl ?? ""
  });

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
      <div>
        <label className="label" htmlFor="record-date">
          日付
        </label>
        <input
          id="record-date"
          className="input date-input"
          type="date"
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="record-weight">
          体重
        </label>
        <input
          id="record-weight"
          className="input"
          type="number"
          min="0"
          step="0.1"
          value={form.taijyuu}
          onChange={(event) => setForm((current) => ({ ...current, taijyuu: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="record-appetite">
          食欲
        </label>
        <select
          id="record-appetite"
          className="input"
          value={form.appetite}
          onChange={(event) => setForm((current) => ({ ...current, appetite: event.target.value as Appetite }))}
        >
          {appetiteOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="record-energy">
          元気度
        </label>
        <select
          id="record-energy"
          className="input"
          value={form.energyLevel}
          onChange={(event) => setForm((current) => ({ ...current, energyLevel: event.target.value as EnergyLevel }))}
        >
          {energyOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="record-poop">
          うんち状態
        </label>
        <select
          id="record-poop"
          className="input"
          value={form.poopCondition}
          onChange={(event) => setForm((current) => ({ ...current, poopCondition: event.target.value as PoopCondition }))}
        >
          {poopOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="record-photo">
          写真URL
        </label>
        <input
          id="record-photo"
          className="input"
          type="text"
          placeholder="https://example.com/photo.jpg"
          value={form.photoUrl.startsWith("data:image/") ? "" : form.photoUrl}
          onChange={(event) => {
            setSelectedFileName("");
            setImageMessage("");
            setForm((current) => ({ ...current, photoUrl: event.target.value }));
          }}
        />
      </div>

      <div>
        <label className="label" htmlFor="record-photo-file">
          端末から写真を追加
        </label>
        <input
          id="record-photo-file"
          className="input file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handleImageChange}
        />
        <p className="mt-2 text-xs leading-5 text-ink/55">
          スマホで撮った大きめの写真も、アプリ側で自動的に軽くしてから保存します。
        </p>
        {selectedFileName ? <p className="mt-2 text-xs text-ink/60">選択中: {selectedFileName}</p> : null}
        {imageMessage ? <p className="mt-2 text-xs text-moss">{imageMessage}</p> : null}
        {form.photoUrl ? (
          <div className="mt-3 overflow-hidden rounded-3xl border border-sand bg-white">
            <img src={form.photoUrl} alt="記録写真のプレビュー" className="h-44 w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="record-memo">
          メモ
        </label>
        <textarea
          id="record-memo"
          className="input min-h-28 resize-none"
          value={form.memo}
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </div>

      <button className="button-primary w-full disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
