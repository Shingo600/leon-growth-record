"use client";

import { BackupManager } from "@/components/backup-manager";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { SummaryCard } from "@/components/summary-card";
import { useAppData } from "@/components/app-provider";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { data } = useAppData();

  return (
    <div className="space-y-5">
      <PageHeader
        title="プロフィール"
        description="愛犬の基本情報を確認しながら編集できます。"
      />

      <section className="grid grid-cols-2 gap-4">
        <SummaryCard label="名前" value={data.profile.name} subValue={data.profile.breed} />
        <SummaryCard
          label="誕生日"
          value={formatDate(data.profile.birthday)}
          subValue={`お迎え日: ${formatDate(data.profile.arrivalDate)}`}
        />
      </section>

      <ProfileForm />
      <BackupManager />
    </div>
  );
}
