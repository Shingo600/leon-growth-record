"use client";

import { useAppData } from "@/components/app-provider";

export function SyncStatusCard() {
  const { storageMode, syncMessage, syncStatus } = useAppData();

  const badge =
    storageMode === "cloud"
      ? syncStatus === "synced"
        ? { label: "同期中", className: "bg-emerald-50 text-emerald-700" }
        : syncStatus === "syncing"
          ? { label: "同期確認中", className: "bg-amber-50 text-amber-700" }
          : { label: "要確認", className: "bg-rose-50 text-rose-700" }
      : { label: "端末保存", className: "bg-cream text-ink/70" };

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">保存と共有</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">{syncMessage}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
      </div>
    </section>
  );
}
