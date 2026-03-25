"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordCard } from "@/components/record-card";
import { WeightChart } from "@/components/weight-chart";
import { useAppData } from "@/components/app-provider";
import { Appetite, EnergyLevel, PoopCondition } from "@/lib/types";

const appetiteOptions: Array<Appetite | "すべて"> = ["すべて", "良い", "普通", "悪い"];
const energyOptions: Array<EnergyLevel | "すべて"> = ["すべて", "元気", "普通", "元気なし"];
const poopOptions: Array<PoopCondition | "すべて"> = ["すべて", "良い", "柔らかい", "下痢"];

export default function RecordsPage() {
  const { data } = useAppData();
  const [searchText, setSearchText] = useState("");
  const [appetiteFilter, setAppetiteFilter] = useState<Appetite | "すべて">("すべて");
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | "すべて">("すべて");
  const [poopFilter, setPoopFilter] = useState<PoopCondition | "すべて">("すべて");

  const filteredRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return data.records.filter((record) => {
      const matchesKeyword =
        keyword.length === 0 ||
        record.date.includes(keyword) ||
        record.memo.toLowerCase().includes(keyword);

      const matchesAppetite = appetiteFilter === "すべて" || record.appetite === appetiteFilter;
      const matchesEnergy = energyFilter === "すべて" || record.energyLevel === energyFilter;
      const matchesPoop = poopFilter === "すべて" || record.poopCondition === poopFilter;

      return matchesKeyword && matchesAppetite && matchesEnergy && matchesPoop;
    });
  }, [appetiteFilter, data.records, energyFilter, poopFilter, searchText]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="成長記録一覧"
        description="体重や毎日の様子を日付順で確認できます。"
        action={<Link href="/records/new" className="button-primary">追加</Link>}
      />

      <WeightChart records={data.records} />

      <section className="card space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold">検索・絞り込み</h3>
          <p className="mt-1 text-sm text-ink/60">メモや体調条件で見たい記録だけに絞れます。</p>
        </div>

        <input
          className="input"
          type="search"
          placeholder="日付やメモで検索"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select className="input" value={appetiteFilter} onChange={(event) => setAppetiteFilter(event.target.value as Appetite | "すべて")}>
            {appetiteOptions.map((option) => (
              <option key={option} value={option}>{`食欲: ${option}`}</option>
            ))}
          </select>

          <select className="input" value={energyFilter} onChange={(event) => setEnergyFilter(event.target.value as EnergyLevel | "すべて")}>
            {energyOptions.map((option) => (
              <option key={option} value={option}>{`元気度: ${option}`}</option>
            ))}
          </select>

          <select className="input" value={poopFilter} onChange={(event) => setPoopFilter(event.target.value as PoopCondition | "すべて")}>
            {poopOptions.map((option) => (
              <option key={option} value={option}>{`うんち: ${option}`}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="button-secondary w-full"
          onClick={() => {
            setSearchText("");
            setAppetiteFilter("すべて");
            setEnergyFilter("すべて");
            setPoopFilter("すべて");
          }}
        >
          条件をリセット
        </button>
      </section>

      <section className="space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => <RecordCard key={record.id} record={record} />)
        ) : (
          <EmptyState
            title={data.records.length > 0 ? "条件に合う記録がありません" : "記録がまだありません"}
            description={
              data.records.length > 0
                ? "検索条件をゆるめると表示される可能性があります。"
                : "最初の記録を追加するとここに一覧表示されます。"
            }
          />
        )}
      </section>
    </div>
  );
}
