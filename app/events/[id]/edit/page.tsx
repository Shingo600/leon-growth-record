"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventForm } from "@/components/event-form";
import { PageHeader } from "@/components/page-header";
import { useAppData } from "@/components/app-provider";

export default function EditEventPage({
  params
}: {
  params: { id: string };
}) {
  const { data, updateEvent } = useAppData();
  const event = data.events.find((item) => item.id === params.id);

  if (!event) {
    return (
      <div className="space-y-5">
        <PageHeader title="予定を編集" description="対象の予定が見つかりませんでした。" />
        <EmptyState title="予定が見つかりません" description="一覧に戻って、別の予定を選んでください。" />
        <Link href="/calendar" className="button-secondary w-full">カレンダーへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="予定を編集"
        description="保存済みの予定内容を更新できます。"
      />
      <EventForm
        initialEvent={event}
        submitLabel="更新する"
        onSubmitEvent={(nextEvent) => updateEvent(event.id, nextEvent)}
      />
    </div>
  );
}
