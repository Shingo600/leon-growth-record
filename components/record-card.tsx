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
    <article className="card overflow-hidden">
      {record.photoUrl ? (
        <div className="h-40 w-full">
          <img
            src={record.photoUrl}
            alt={`${formatDate(record.date)}の記録写真`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink/60">
              {formatDate(record.date, { year: "numeric", month: "numeric", day: "numeric" })}
            </p>
            <p className="mt-1 text-xl font-semibold">{record.taijyuu.toFixed(1)} kg</p>
          </div>
          <span className="rounded-full bg-sand/45 px-3 py-1 text-xs font-medium text-ink/70">
            {record.energyLevel}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm text-ink/75">
          <div>
            <dt className="text-ink/50">食欲</dt>
            <dd className="mt-1 font-medium">{record.appetite}</dd>
          </div>
          <div>
            <dt className="text-ink/50">うんち状態</dt>
            <dd className="mt-1 font-medium">{record.poopCondition}</dd>
          </div>
        </dl>

        <p className="rounded-3xl bg-cream px-4 py-3 text-sm leading-6 text-ink/75">
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
    </article>
  );
}
