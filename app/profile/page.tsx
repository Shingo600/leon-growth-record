"use client";

import { BackupManager } from "@/components/backup-manager";
import { FoodDatabaseManager } from "@/components/food-database-manager";
import { ProfileForm } from "@/components/profile-form";
import { SyncStatusCard } from "@/components/sync-status-card";
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
  const goals = data.profile.dailyGoals;
  const goalTotal = goals.walkMinutes + goals.intelligenceMinutes + goals.trainingMinutes;
  const latestFood = data.foodItems[0];

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">レオンの基本設定を、ここでまとめて整えます。</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">プロフィール・設定</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">写真、活動目標、共有、フードDB、バックアップを一画面に整理しました。</p>
        </div>
        <a href="#profile-edit" className="button-primary">
          プロフィールを編集
        </a>
      </section>

      <section className="card overflow-hidden p-5">
        <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
          <div className="text-center">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-[2rem] bg-cream ring-4 ring-indigo-50">
              <img
                src={data.profile.photoUrl || "/placeholder-dog.svg"}
                alt={`${data.profile.name}のプロフィール写真`}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
              {data.profile.breed || "犬種未設定"}
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-4xl font-bold tracking-tight">{data.profile.name || "レオン"}</h3>
              <span className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-ink/70">{data.profile.gender}</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-ink/70">{ageText}</p>

            <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ProfileMetric label="誕生日" value={birthdayText} tone="amber" />
              <ProfileMetric label="お迎え日" value={arrivalDateText} tone="orange" />
              <ProfileMetric label="現在体重" value={`${data.profile.currentWeight || 0}kg`} tone="emerald" />
              <ProfileMetric label="活動目標" value={`${goalTotal}分/日`} tone="indigo" />
            </dl>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="基本情報" value={data.profile.breed || "未設定"} detail={`年齢: ${ageText}`} tone="indigo" />
        <SummaryCard
          label="活動目標"
          value={`${goalTotal}分`}
          detail={`散歩${goals.walkMinutes}分 / 知育${goals.intelligenceMinutes}分 / トレ${goals.trainingMinutes}分`}
          tone="emerald"
        />
        <SummaryCard label="共有設定" value="保存と共有" detail="家族共有や端末保存を管理" tone="amber" />
        <SummaryCard
          label="フードDB"
          value={`${data.foodItems.length}件`}
          detail={latestFood ? `最近: ${latestFood.productName}` : "ごはん候補を登録できます"}
          tone="rose"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div id="profile-edit" className="space-y-5">
          <div className="card p-5">
            <p className="text-sm font-semibold text-indigo-600">プロフィール編集</p>
            <h3 className="mt-1 text-2xl font-bold">基本情報と毎日の目標</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">ホームや記録画面で使う、レオンの基本データを更新できます。</p>
          </div>
          <ProfileForm />
        </div>

        <aside className="space-y-5">
          <SyncStatusCard />
          <FoodDatabaseManager />
          <BackupManager />
        </aside>
      </section>
    </div>
  );
}

function ProfileMetric({ label, value, tone }: { label: string; value: string; tone: "indigo" | "amber" | "orange" | "emerald" }) {
  const toneClassName = {
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    orange: "bg-orange-50 text-orange-700",
    emerald: "bg-emerald-50 text-emerald-700"
  }[tone];

  return (
    <div className="rounded-3xl border border-line bg-white px-4 py-3">
      <dt className={`inline-flex rounded-2xl px-3 py-1 text-xs font-bold ${toneClassName}`}>{label}</dt>
      <dd className="mt-3 text-lg font-bold">{value}</dd>
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
  tone: "indigo" | "emerald" | "amber" | "rose";
}) {
  const toneClassName = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  }[tone];

  return (
    <article className="card p-5">
      <p className={`inline-flex rounded-2xl px-3 py-1 text-xs font-bold ${toneClassName}`}>{label}</p>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">{detail}</p>
    </article>
  );
}
