"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { HealthCard } from "@/components/health-card";
import { useAppData } from "@/components/app-provider";
import { HealthRecordType } from "@/lib/types";
import { formatDate, getTodayDateString } from "@/lib/utils";

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

  const today = getTodayDateString();
  const upcomingCare = useMemo(
    () =>
      data.healthRecords
        .filter((record) => record.nextDueDate && record.nextDueDate >= today)
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
    [data.healthRecords, today]
  );
  const nextCare = upcomingCare[0];
  const recentHospital = data.healthRecords.find((record) => record.type === "通院");
  const medicationCount = data.healthRecords.filter((record) => record.type === "投薬").length;
  const inspectionCount = data.healthRecords.filter((record) => record.type === "検査").length;
  const memoRecords = data.healthRecords.filter((record) => record.memo.trim() || record.doctorNote.trim()).slice(0, 3);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">通院・投薬・検査を、あとで迷わず振り返れます。</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">健康記録</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">次回ケア予定と気になるメモを一緒に見られるようにしました。</p>
        </div>
        <Link href="/health/new" className="button-primary">
          健康履歴を追加
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="次回予定"
          value={nextCare ? formatDate(nextCare.nextDueDate, { year: "numeric", month: "numeric", day: "numeric", weekday: "short" }) : "未設定"}
          detail={nextCare ? nextCare.title : "予定日を入れるとここに表示"}
          tone="indigo"
        />
        <SummaryCard
          label="通院履歴"
          value={`${data.healthRecords.filter((record) => record.type === "通院").length}回`}
          detail={recentHospital ? `直近: ${formatDate(recentHospital.date)}` : "まだ記録がありません"}
          tone="sky"
        />
        <SummaryCard
          label="投薬記録"
          value={`${medicationCount}件`}
          detail={medicationCount > 0 ? "飲ませた薬を一覧で確認" : "投薬があれば記録できます"}
          tone="amber"
        />
        <SummaryCard
          label="検査メモ"
          value={`${inspectionCount}件`}
          detail={inspectionCount > 0 ? "検査結果をすぐ探せます" : "血液検査などを残せます"}
          tone="emerald"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">検索・絞り込み</h3>
                <p className="mt-1 text-sm text-ink/60">病院名、症状、メモ、日付からすぐ探せます。</p>
              </div>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-sm"
                onClick={() => {
                  setSearchText("");
                  setTypeFilter("すべて");
                }}
              >
                リセット
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
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
            </div>

            <div className="flex flex-wrap gap-2">
              {healthTypeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    typeFilter === option ? "bg-indigo-600 text-white" : "bg-white text-ink/70 ring-1 ring-line"
                  }`}
                  onClick={() => setTypeFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">健康タイムライン</p>
                <h3 className="text-2xl font-bold">履歴一覧</h3>
              </div>
              <p className="text-sm font-semibold text-ink/55">{filteredRecords.length}件</p>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-3">
                {filteredRecords.map((record) => <HealthCard key={record.id} record={record} />)}
              </div>
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

        <aside className="space-y-5">
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">次回ケア予定</p>
                <h3 className="mt-1 text-xl font-bold">{nextCare ? nextCare.title : "予定なし"}</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {upcomingCare.length}件
              </span>
            </div>

            {upcomingCare.length > 0 ? (
              <div className="space-y-2">
                {upcomingCare.slice(0, 3).map((record) => (
                  <Link key={record.id} href={`/health/${record.id}/edit`} className="block rounded-2xl border border-line bg-white px-4 py-3">
                    <p className="text-sm font-bold">{formatDate(record.nextDueDate, { month: "numeric", day: "numeric", weekday: "short" })}</p>
                    <p className="mt-1 text-sm text-ink/65">{record.title}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-ink/60">
                次回予定日を記録しておくと、ここで見落としを防げます。
              </p>
            )}
          </section>

          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-600">気になるメモ</p>
                <h3 className="mt-1 text-xl font-bold">最近の観察</h3>
              </div>
              <Link href="/health/new" className="text-sm font-bold text-indigo-600">
                追加
              </Link>
            </div>

            {memoRecords.length > 0 ? (
              <div className="space-y-2">
                {memoRecords.map((record) => (
                  <Link key={record.id} href={`/health/${record.id}/edit`} className="block rounded-2xl bg-cream px-4 py-3">
                    <p className="text-xs font-bold text-ink/45">{formatDate(record.date)} / {record.type}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink/70">{record.memo || record.doctorNote}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-ink/60">
                体調の変化や先生に聞きたいことを残すと、診察時に使いやすくなります。
              </p>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  tone: "indigo" | "sky" | "amber" | "emerald";
}) {
  const toneClassName = {
    indigo: "bg-indigo-50 text-indigo-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700"
  }[tone];

  return (
    <article className="card p-5">
      <p className={`inline-flex rounded-2xl px-3 py-1 text-xs font-bold ${toneClassName}`}>{label}</p>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{detail}</p>
    </article>
  );
}
