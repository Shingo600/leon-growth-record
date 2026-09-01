"use client";

import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { GrowthRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function RecordCard({ record }: { record: GrowthRecord }) {
  const { deleteRecord } = useAppData();

  function handleDelete() {
    const confirmed = window.confirm("この成長記録を削除しますか？");
    if (!confirmed) {
      return;
    }

    deleteRecord(record.id);
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_12px_30px_-28px_rgba(47,42,37,0.55)]">
      <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
        {record.photoUrl ? (
          <div className="h-40 w-full md:h-full">
            <img
              src={record.photoUrl}
              alt={`${formatDate(record.date)}の記録写真`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="hidden bg-cream md:grid md:place-items-center">
            <span className="text-sm font-semibold text-ink/40">写真なし</span>
          </div>
        )}

        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink/60">
                {formatDate(record.date, { year: "numeric", month: "numeric", day: "numeric", weekday: "short" })}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{record.taijyuu.toFixed(1)} <span className="text-base">kg</span></p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {record.energyLevel}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm text-ink/75">
            <div className="rounded-2xl bg-cream px-3 py-2">
              <dt className="text-ink/50">食欲</dt>
              <dd className="mt-1 font-bold">{record.appetite}</dd>
            </div>
            <div className="rounded-2xl bg-cream px-3 py-2">
              <dt className="text-ink/50">うんち状態</dt>
              <dd className="mt-1 font-bold">{record.poopCondition}</dd>
            </div>
          </dl>

          <p className="rounded-3xl bg-cream/70 px-4 py-3 text-sm leading-6 text-ink/75">
            {record.memo || "メモはありません"}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Link href={`/records/${record.id}/edit`} className="button-secondary w-full">
              編集
            </Link>
            <button type="button" className="button-secondary w-full" onClick={handleDelete}>
              削除
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
