"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { PageHeader } from "@/components/page-header";
import { SummaryCard } from "@/components/summary-card";
import { WeightChart } from "@/components/weight-chart";
import { useAppData } from "@/components/app-provider";
import { formatDate, getUpcomingEvents } from "@/lib/utils";

export default function HomePage() {
  const { data } = useAppData();
  const latestRecord = data.records[0];
  const upcomingEvents = getUpcomingEvents(data.events).slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        title="ホーム"
        description="今日の予定と最新の様子をすぐ確認できます。"
      />

      <section className="grid grid-cols-2 gap-4">
        <SummaryCard label="最新体重" value={`${data.profile.currentWeight.toFixed(1)} kg`} />
        <SummaryCard
          label="最新記録"
          value={latestRecord ? formatDate(latestRecord.date) : "未登録"}
          subValue={latestRecord ? `${latestRecord.energyLevel} / ${latestRecord.appetite}` : "まずは記録を追加しましょう"}
        />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/records/new" className="button-primary w-full">記録を追加</Link>
        <Link href="/events/new" className="button-secondary w-full">予定を追加</Link>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <Link href="/health" className="button-secondary w-full">健康履歴を見る</Link>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">今日からの予定</h3>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <EmptyState title="予定はまだありません" description="散歩や通院の予定を追加しておくと見返しやすくなります。" />
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">体重の変化</h3>
        <WeightChart records={data.records} />
      </section>
    </div>
  );
}
