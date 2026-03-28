"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { EmptyState } from "@/components/empty-state";
import { EventForm } from "@/components/event-form";
import { PageHeader } from "@/components/page-header";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const { data, updateEvent } = useAppData();
  const event = data.events.find((item) => item.id === params.id);

  if (!event) {
    return (
      <div className="space-y-5">
        <PageHeader title="予定を編集" description="編集したい予定が見つからない場合は一覧から選び直してください。" />
        <EmptyState title="予定が見つかりません" description="カレンダーに戻って、編集したい予定を選んでください。" />
        <Link href="/calendar" className="button-secondary w-full">
          カレンダーへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="予定を編集" description="保存済みの予定内容を更新できます。" />
      <EventForm
        initialEvent={event}
        submitLabel="更新する"
        onSubmitEvent={(nextEvent) => updateEvent(event.id, nextEvent)}
      />
    </div>
  );
}
