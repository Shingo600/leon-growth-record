"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordForm } from "@/components/record-form";

export default function EditRecordPage() {
  const params = useParams<{ id: string }>();
  const { data, updateRecord } = useAppData();
  const record = data.records.find((item) => item.id === params.id);

  if (!record) {
    return (
      <div className="space-y-5">
        <PageHeader title="成長記録を編集" description="編集したい記録が見つからない場合は一覧から選び直してください。" />
        <EmptyState title="記録が見つかりません" description="一覧に戻って、編集したい成長記録を選んでください。" />
        <Link href="/records" className="button-secondary w-full">
          記録一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="成長記録を編集" description="保存済みの記録内容を更新できます。" />
      <RecordForm
        initialRecord={record}
        submitLabel="更新する"
        onSubmitRecord={(nextRecord) => updateRecord(record.id, nextRecord)}
      />
    </div>
  );
}
