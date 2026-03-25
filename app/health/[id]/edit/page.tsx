"use client";

import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { EmptyState } from "@/components/empty-state";
import { HealthForm } from "@/components/health-form";
import { PageHeader } from "@/components/page-header";

export default function EditHealthPage({
  params
}: {
  params: { id: string };
}) {
  const { data, updateHealthRecord } = useAppData();
  const record = data.healthRecords.find((item) => item.id === params.id);

  if (!record) {
    return (
      <div className="space-y-5">
        <PageHeader title="健康履歴を編集" description="対象の履歴が見つかりませんでした。" />
        <EmptyState title="健康履歴が見つかりません" description="一覧に戻って、別の履歴を選んでください。" />
        <Link href="/health" className="button-secondary w-full">健康履歴へ戻る</Link>
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
