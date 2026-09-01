"use client";

import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { HealthRecord } from "@/lib/types";
import { formatDate, getHealthTypeClassName } from "@/lib/utils";

export function HealthCard({ record }: { record: HealthRecord }) {
  const { deleteHealthRecord } = useAppData();
  const hasNextDue = Boolean(record.nextDueDate);
  const notePreview = record.doctorNote || record.memo || "診察メモ・補足メモはありません";

  function handleDelete() {
    const confirmed = window.confirm("この健康履歴を削除しますか？");
    if (!confirmed) {
      return;
    }

    deleteHealthRecord(record.id);
  }

  return (
    <article className="rounded-3xl border border-line bg-white p-4 shadow-[0_12px_30px_-28px_rgba(47,42,37,0.55)]">
      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_150px] md:items-center">
        <div className="flex items-center gap-3 md:block">
          <span className="hidden h-3 w-3 rounded-full bg-indigo-500 md:block" />
          <p className="text-base font-bold md:mt-2">
            {formatDate(record.date, { year: "numeric", month: "numeric", day: "numeric", weekday: "short" })}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getHealthTypeClassName(record.type)}`}>
              {record.type}
            </span>
            {hasNextDue ? (
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/60">
                次回 {formatDate(record.nextDueDate)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-bold">{record.title}</h3>
          <p className="mt-1 text-sm text-ink/55">{record.hospital || "病院名 未入力"}</p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/70">{notePreview}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
          <Link href={`/health/${record.id}/edit`} className="button-secondary w-full px-3 py-2 text-sm">編集</Link>
          <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={handleDelete}>削除</button>
        </div>
      </div>
    </article>
  );
}
