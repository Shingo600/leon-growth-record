"use client";

import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { HealthRecord } from "@/lib/types";
import { formatDate, getHealthTypeClassName } from "@/lib/utils";

export function HealthCard({ record }: { record: HealthRecord }) {
  const { deleteHealthRecord } = useAppData();

  function handleDelete() {
    const confirmed = window.confirm("この健康履歴を削除しますか？");
    if (!confirmed) {
      return;
    }

    deleteHealthRecord(record.id);
  }

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">
            {formatDate(record.date, { year: "numeric", month: "numeric", day: "numeric" })}
          </p>
          <p className="mt-1 text-lg font-semibold">{record.title}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getHealthTypeClassName(record.type)}`}>
          {record.type}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-ink/75">
        <div>
          <dt className="text-ink/50">病院名</dt>
          <dd className="mt-1 font-medium">{record.hospital || "未入力"}</dd>
        </div>
        <div>
          <dt className="text-ink/50">診察メモ</dt>
          <dd className="mt-1 leading-6">{record.doctorNote || "なし"}</dd>
        </div>
        <div>
          <dt className="text-ink/50">次回予定日</dt>
          <dd className="mt-1 font-medium">{record.nextDueDate ? formatDate(record.nextDueDate) : "未設定"}</dd>
        </div>
      </dl>

      <p className="mt-4 rounded-3xl bg-cream px-4 py-3 text-sm leading-6 text-ink/75">
        {record.memo || "補足メモはありません"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href={`/health/${record.id}/edit`} className="button-secondary w-full">編集</Link>
        <button type="button" className="button-secondary w-full" onClick={handleDelete}>削除</button>
      </div>
    </article>
  );
}
