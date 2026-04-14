"use client";

import { useState } from "react";
import { useAppData } from "@/components/app-provider";

export function SyncStatusCard() {
  const { connectSync, disconnectSync, storageMode, syncAuthRequired, syncMessage, syncStatus } = useAppData();
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const badge =
    storageMode === "cloud"
      ? syncStatus === "synced"
        ? { label: "同期中", className: "bg-emerald-50 text-emerald-700" }
        : syncStatus === "syncing"
          ? { label: "同期確認中", className: "bg-amber-50 text-amber-700" }
          : { label: "要確認", className: "bg-rose-50 text-rose-700" }
      : { label: "端末保存", className: "bg-cream text-ink/70" };

  async function handleConnect() {
    const nextPasscode = passcode.trim();
    if (!nextPasscode) {
      return;
    }

    setIsSubmitting(true);
    const success = await connectSync(nextPasscode);
    if (success) {
      setPasscode("");
    }
    setIsSubmitting(false);
  }

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">保存と共有</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">{syncMessage}</p>
          <p className="mt-2 text-xs leading-5 text-ink/45">端末で選んだ写真は容量対策のためクラウド共有には含めず、この端末に残します。</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
      </div>

      {syncAuthRequired ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-ink">
            同期コード
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="家族で使う同期コード"
              className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none transition focus:border-accent/60"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              void handleConnect();
            }}
            disabled={isSubmitting || !passcode.trim()}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "接続中..." : "クラウド共有を有効にする"}
          </button>
        </div>
      ) : null}

      {storageMode === "cloud" ? (
        <button
          type="button"
          onClick={() => {
            void disconnectSync();
          }}
          className="mt-4 w-full rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          この端末をローカル保存に戻す
        </button>
      ) : null}
    </section>
  );
}
