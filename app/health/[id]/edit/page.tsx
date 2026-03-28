"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { EmptyState } from "@/components/empty-state";
import { HealthForm } from "@/components/health-form";
import { PageHeader } from "@/components/page-header";

export default function EditHealthPage() {
  const params = useParams<{ id: string }>();
  const { data, updateHealthRecord } = useAppData();
  const record = data.healthRecords.find((item) => item.id === params.id);

  if (!record) {
    return (
      <div className="space-y-5">
        <PageHeader title="健康履歴を編集" description="編集したい履歴が見つからない場合は一覧から選び直してください。" />
        <EmptyState title="健康履歴が見つかりません" description="健康タブに戻って、編集したい履歴を選んでください。" />
        <Link href="/health" className="button-secondary w-full">
          健康タブへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="健康履歴を編集" description="保存済みの健康履歴を更新できます。" />
      <HealthForm
        initialRecord={record}
        submitLabel="更新する"
        onSubmitRecord={(nextRecord) => updateHealthRecord(record.id, nextRecord)}
      />
    </div>
  );
}
