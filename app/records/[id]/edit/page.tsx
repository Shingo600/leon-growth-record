"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordForm } from "@/components/record-form";
import { useAppData } from "@/components/app-provider";

export default function EditRecordPage({
  params
}: {
  params: { id: string };
}) {
  const { data, updateRecord } = useAppData();
  const record = data.records.find((item) => item.id === params.id);

  if (!record) {
    return (
      <div className="space-y-5">
        <PageHeader title="成長記録を編集" description="対象の記録が見つかりませんでした。" />
        <EmptyState title="記録が見つかりません" description="一覧に戻って、別の記録を選んでください。" />
        <Link href="/records" className="button-secondary w-full">記録一覧へ戻る</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="成長記録を編集"
        description="保存済みの記録内容を更新できます。"
      />
      <RecordForm
        initialRecord={record}
        submitLabel="更新する"
        onSubmitRecord={(nextRecord) => updateRecord(record.id, nextRecord)}
      />
    </div>
  );
}
