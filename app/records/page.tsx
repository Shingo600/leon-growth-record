"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { RecordCard } from "@/components/record-card";
import { RecordForm } from "@/components/record-form";
import { WeightChart } from "@/components/weight-chart";
import { useAppData } from "@/components/app-provider";
import { Appetite, EnergyLevel, PoopCondition } from "@/lib/types";
import { formatDate, getTodayDateString } from "@/lib/utils";

const appetiteOptions: Array<Appetite | "すべて"> = ["すべて", "良い", "普通", "悪い"];
const energyOptions: Array<EnergyLevel | "すべて"> = ["すべて", "元気", "普通", "元気なし"];
const poopOptions: Array<PoopCondition | "すべて"> = ["すべて", "良い", "柔らかい", "下痢"];

export default function RecordsPage() {
  const { data } = useAppData();
  const [searchText, setSearchText] = useState("");
  const [appetiteFilter, setAppetiteFilter] = useState<Appetite | "すべて">("すべて");
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | "すべて">("すべて");
  const [poopFilter, setPoopFilter] = useState<PoopCondition | "すべて">("すべて");
  const latestRecord = data.records[0];
  const previousRecord = data.records[1];
  const currentWeight = latestRecord?.taijyuu ?? data.profile.currentWeight;
  const diffFromPrevious = latestRecord && previousRecord ? latestRecord.taijyuu - previousRecord.taijyuu : null;
  const targetWeight = 20;
  const targetProgress = Math.min(Math.round((currentWeight / targetWeight) * 100), 100);
  const today = getTodayDateString();

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
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">レオンの体重の変化を記録して、健康管理に役立てましょう。</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">体重記録</h2>
        </div>
        <Link href="/records/new" className="button-secondary px-4 py-3">
          体重の目安について
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-xl text-white" aria-hidden="true">⚖</div>
            <p className="text-sm font-bold text-ink/70">現在の体重</p>
          </div>
          <p className="mt-5 text-5xl font-bold tracking-tight">{currentWeight.toFixed(1)}<span className="ml-1 text-xl">kg</span></p>
          <p className="mt-3 text-sm text-ink/55">
            {latestRecord ? `記録日時: ${formatDate(latestRecord.date, { year: "numeric", month: "numeric", day: "numeric" })}` : "プロフィールの体重を表示しています"}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl text-emerald-700" aria-hidden="true">↗</div>
              <p className="text-sm font-bold text-ink/70">前回比</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {diffFromPrevious === null || diffFromPrevious <= 0 ? "順調です" : "増加"}
            </span>
          </div>
          <p className={`mt-5 text-5xl font-bold tracking-tight ${diffFromPrevious !== null && diffFromPrevious > 0 ? "text-orange-600" : "text-emerald-700"}`}>
            {diffFromPrevious === null ? "±0.0" : `${diffFromPrevious >= 0 ? "+" : ""}${diffFromPrevious.toFixed(1)}`}<span className="ml-1 text-xl">kg</span>
          </p>
          <p className="mt-3 text-sm text-ink/55">
            {previousRecord ? `前回: ${previousRecord.taijyuu.toFixed(1)}kg` : "比較できる前回記録はまだありません"}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-xl text-orange-700" aria-hidden="true">⚑</div>
            <p className="text-sm font-bold text-ink/70">目標体重</p>
          </div>
          <p className="mt-5 text-5xl font-bold tracking-tight">{targetWeight.toFixed(1)}<span className="ml-1 text-xl">kg</span></p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-cream">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${targetProgress}%` }} />
          </div>
          <p className="mt-3 text-sm text-ink/55">達成率 {targetProgress}%</p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <WeightChart records={data.records} />

          <section className="card space-y-4 p-5">
            <div>
              <h3 className="text-xl font-bold">検索・絞り込み</h3>
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

          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">最近の記録</p>
                <h3 className="mt-1 text-xl font-bold">体重とメモを確認</h3>
              </div>
              <Link href="/records/new" className="button-primary px-4 py-2 text-sm">
                追加
              </Link>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-3">
                {filteredRecords.map((record) => <RecordCard key={record.id} record={record} />)}
              </div>
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

        <aside className="space-y-5">
          <section className="card space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold text-indigo-600">今日の体重を記録</p>
              <h3 className="mt-1 text-xl font-bold">すぐ保存</h3>
            </div>
            <RecordForm
              initialDate={today}
              redirectOnSubmit={false}
              className="space-y-4 rounded-3xl bg-cream/70 p-4"
            />
          </section>

          <section className="card space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold text-indigo-600">写真・メモプレビュー</p>
              <h3 className="mt-1 text-xl font-bold">直近の様子</h3>
            </div>
            {latestRecord?.photoUrl ? (
              <img src={latestRecord.photoUrl} alt="直近の記録写真" className="h-44 w-full rounded-3xl object-cover" />
            ) : (
              <div className="grid h-44 place-items-center rounded-3xl bg-cream text-sm font-semibold text-ink/45">
                写真はまだありません
              </div>
            )}
            <p className="rounded-3xl bg-cream px-4 py-3 text-sm leading-6 text-ink/70">
              {latestRecord?.memo || "直近のメモはありません。"}
            </p>
          </section>

          <section className="card overflow-hidden p-5">
            <p className="text-sm font-semibold text-indigo-600">健康のヒント</p>
            <h3 className="mt-2 text-lg font-bold">理想的な体重を維持できていますね！</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              体重の変化をゆるやかに追うと、ごはん量や活動量の調整に役立ちます。
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
