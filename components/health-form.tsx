"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import type { HealthRecord, HealthRecordType } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

const healthTypes: HealthRecordType[] = ["ワクチン", "通院", "投薬", "検査", "その他"];

type HealthFormProps = {
  initialRecord?: HealthRecord;
  initialDate?: string;
  submitLabel?: string;
  onSubmitRecord?: (record: Omit<HealthRecord, "id" | "createdAt">) => void;
  redirectOnSubmit?: boolean;
  className?: string;
};

export function HealthForm({
  initialRecord,
  initialDate,
  submitLabel = "健康履歴を保存",
  onSubmitRecord,
  redirectOnSubmit = true,
  className = "card space-y-5 p-5"
}: HealthFormProps) {
  const router = useRouter();
  const { addHealthRecord } = useAppData();
  const [form, setForm] = useState({
    date: initialRecord?.date ?? initialDate ?? getTodayDateString(),
    type: initialRecord?.type ?? ("通院" as HealthRecordType),
    title: initialRecord?.title ?? "",
    hospital: initialRecord?.hospital ?? "",
    doctorNote: initialRecord?.doctorNote ?? "",
    nextDueDate: initialRecord?.nextDueDate ?? "",
    memo: initialRecord?.memo ?? ""
  });

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmitRecord) {
          onSubmitRecord(form);
        } else {
          addHealthRecord(form);
        }

        if (redirectOnSubmit) {
          router.push("/health");
        }
      }}
    >
      <div>
        <label className="label" htmlFor="health-date">
          日付
        </label>
        <input
          id="health-date"
          className="input date-input"
          type="date"
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="health-type">
          種類
        </label>
        <select
          id="health-type"
          className="input"
          value={form.type}
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as HealthRecordType }))}
        >
          {healthTypes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="health-title">
          タイトル
        </label>
        <input
          id="health-title"
          className="input"
          type="text"
          placeholder="例: 狂犬病ワクチン"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="health-hospital">
          病院名
        </label>
        <input
          id="health-hospital"
          className="input"
          type="text"
          value={form.hospital}
          onChange={(event) => setForm((current) => ({ ...current, hospital: event.target.value }))}
        />
      </div>

      <div>
        <label className="label" htmlFor="health-doctor-note">
          診察メモ
        </label>
        <textarea
          id="health-doctor-note"
          className="input min-h-24 resize-none"
          value={form.doctorNote}
          onChange={(event) => setForm((current) => ({ ...current, doctorNote: event.target.value }))}
        />
      </div>

      <div>
        <label className="label" htmlFor="health-next-date">
          次回予定日
        </label>
        <input
          id="health-next-date"
          className="input date-input"
          type="date"
          value={form.nextDueDate}
          onChange={(event) => setForm((current) => ({ ...current, nextDueDate: event.target.value }))}
        />
      </div>

      <div>
        <label className="label" htmlFor="health-memo">
          メモ
        </label>
        <textarea
          id="health-memo"
          className="input min-h-28 resize-none"
          value={form.memo}
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </div>

      <button className="button-primary w-full" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
