"use client";

import { BackupManager } from "@/components/backup-manager";
import { FoodDatabaseManager } from "@/components/food-database-manager";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { useAppData } from "@/components/app-provider";
import { formatDate, getAgeText } from "@/lib/utils";

export default function ProfilePage() {
  const { data } = useAppData();
  const birthdayText = data.profile.birthday
    ? formatDate(data.profile.birthday, { year: "numeric", month: "numeric", day: "numeric" })
    : "未設定";
  const arrivalDateText = data.profile.arrivalDate
    ? formatDate(data.profile.arrivalDate, { year: "numeric", month: "numeric", day: "numeric" })
    : "未設定";
  const ageText = data.profile.birthday ? getAgeText(data.profile.birthday) : "未設定";

  return (
    <div className="space-y-5">
      <PageHeader
        title="プロフィール"
        description="愛犬の基本情報、目標、写真、ごはんデータベースをまとめて整えられます。"
      />

      <section className="card flex items-center gap-4 p-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-cream">
          <img
            src={data.profile.photoUrl || "/placeholder-dog.svg"}
            alt={`${data.profile.name}のプロフィール写真`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink/60">名前</p>
          <p className="mt-1 text-2xl font-semibold">{data.profile.name || "レオン"}</p>
          <p className="mt-1 text-sm text-ink/70">{data.profile.breed || "未設定"}</p>
          <p className="mt-1 text-sm font-medium text-ink/75">年齢: {ageText}</p>
          <p className="mt-3 text-sm text-ink/60">誕生日: {birthdayText}</p>
          <p className="mt-1 text-sm text-ink/60">お迎え日: {arrivalDateText}</p>
        </div>
      </section>

      <ProfileForm />
      <FoodDatabaseManager />
      <BackupManager />
    </div>
  );
}
