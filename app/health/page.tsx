"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { HealthCard } from "@/components/health-card";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/components/app-provider";
import { HealthRecordType } from "@/lib/types";

const healthTypeOptions: Array<HealthRecordType | "すべて"> = ["すべて", "ワクチン", "通院", "投薬", "検査", "その他"];

export default function HealthPage() {
  const { data } = useAppData();
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<HealthRecordType | "すべて">("すべて");

  const filteredRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return data.healthRecords.filter((record) => {
      const matchesKeyword =
        keyword.length === 0 ||
        record.title.toLowerCase().includes(keyword) ||
        record.memo.toLowerCase().includes(keyword) ||
        record.hospital.toLowerCase().includes(keyword) ||
        record.date.includes(keyword);

      const matchesType = typeFilter === "すべて" || record.type === typeFilter;
      return matchesKeyword && matchesType;
    });
  }, [data.healthRecords, searchText, typeFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="健康履歴"
        description="ワクチン、通院、投薬などの履歴をまとめて管理できます。"
        action={<Link href="/health/new" className="button-primary">追加</Link>}
      />

      <section className="card space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold">検索・絞り込み</h3>
          <p className="mt-1 text-sm text-ink/60">病院名や種類で見たい健康履歴だけを表示できます。</p>
        </div>

        <input
          className="input"
          type="search"
          placeholder="タイトル・病院名・メモ・日付で検索"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as HealthRecordType | "すべて")}>
          {healthTypeOptions.map((option) => (
            <option key={option} value={option}>{`種類: ${option}`}</option>
          ))}
        </select>

        <button
          type="button"
          className="button-secondary w-full"
          onClick={() => {
            setSearchText("");
            setTypeFilter("すべて");
          }}
        >
          条件をリセット
        </button>
      </section>

      <section className="space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => <HealthCard key={record.id} record={record} />)
        ) : (
          <EmptyState
            title={data.healthRecords.length > 0 ? "条件に合う健康履歴がありません" : "健康履歴がまだありません"}
            description={
              data.healthRecords.length > 0
                ? "検索条件を変更すると表示される可能性があります。"
                : "ワクチンや通院履歴を追加するとここに一覧表示されます。"
            }
          />
        )}
      </section>
    </div>
  );
}
