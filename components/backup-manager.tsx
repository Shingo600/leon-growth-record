"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { defaultAppData, sampleAppData } from "@/lib/dummy-data";
import { createBackupData, MAX_BACKUP_BYTES, parseBackupData } from "@/lib/storage";

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readFileText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsText(file, "utf-8");
  });
}

export function BackupManager() {
  const { data, canReplaceLocalData, replaceLocalData } = useAppData();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function applyLocalChange(next: typeof data, success: string) {
    if (!replaceLocalData(next)) {
      setMessage("");
      setError("この端末だけの保存を確認できませんでした。同期状態と端末の保存設定を確認してください。");
      return;
    }
    setError("");
    setMessage(success);
  }

  function handleExport() {
    const backup = createBackupData(data);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`leon-growth-record-backup-${dateStamp}.json`, JSON.stringify(backup, null, 2));
    setError("");
    setMessage("バックアップファイルを書き出しました。");
  }

  function handleSampleLoad() {
    if (!canReplaceLocalData) return;
    if (!window.confirm("サンプルデータをこの端末に読み込みます。現在のデータは上書きされます。よろしいですか？")) {
      return;
    }

    applyLocalChange(sampleAppData, "サンプルデータをこの端末に読み込みました。");
  }

  function handleReset() {
    if (!canReplaceLocalData) return;
    if (!window.confirm("この端末のデータを空の状態に戻します。よろしいですか？")) {
      return;
    }

    applyLocalChange(defaultAppData, "この端末のデータを初期化しました。");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      if (!canReplaceLocalData) return;
      if (file.size > MAX_BACKUP_BYTES) {
        setMessage("");
        setError("バックアップが大きすぎます（上限16MB）。");
        return;
      }
      const text = await readFileText(file);
      const parsed = parseBackupData(text);

      if (!parsed.ok) {
        setMessage("");
        setError(parsed.message);
        return;
      }

      const confirmed = window.confirm("この端末のデータをバックアップの内容で上書きします。家族の共有データは変更しません。よろしいですか？");
      if (!confirmed) {
        return;
      }

      applyLocalChange(parsed.data, "この端末にバックアップを復元しました。");
    } catch {
      setMessage("");
      setError("バックアップファイルの読み込みに失敗しました。");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div>
        <h3 className="text-lg font-semibold">データ管理</h3>
        <p className="mt-1 text-sm leading-6 text-ink/60">
          クラウド共有とは別に、手元へバックアップを書き出せます。大きな編集前や端末変更前に保存しておくと安心です。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="button-primary w-full" onClick={handleExport}>
          バックアップを書き出す
        </button>
        <button type="button" className="button-secondary w-full" disabled={!canReplaceLocalData} onClick={handleSampleLoad}>
          サンプルデータを入れる
        </button>
      </div>

      <p className="text-sm leading-6 text-ink/60">
        {canReplaceLocalData
          ? "初期化・サンプル読込・復元は端末だけに反映します。再接続前に、残したい端末データを書き出してください。"
          : "共有記録を守るため、初期化・サンプル読込・復元は端末保存に切り替えてから行えます。"}
      </p>

      <p className="text-sm leading-6 text-ink/60">
        このJSONには端末内の記録・プロフィール写真や画像URLが含まれる場合があります。アルバムの写真は
        <Link href="/album" className="font-semibold text-indigo-700 underline">アルバム</Link>
        で開き、「写真を保存」から別に手元へ残してください。
      </p>

      <p className="text-sm leading-6 text-ink/60">
        おでかけの「行きたい場所」は別保存です。書き出し・復元は
        <Link href="/outings" className="font-semibold text-indigo-700 underline">おでかけタブの「行きたい」</Link>
        から行えます。下の初期化では行きたい場所は削除されません。
      </p>

      <div>
        <label className="label" htmlFor="backup-import">バックアップを復元</label>
        <input
          id="backup-import"
          className="input file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          type="file"
          accept=".json,application/json"
          disabled={!canReplaceLocalData}
          onChange={handleImport}
        />
        <p className="mt-2 text-xs leading-5 text-ink/55">
          先にバックアップを書き出してから復元するのがおすすめです。
        </p>
      </div>

      <button type="button" className="button-secondary w-full" disabled={!canReplaceLocalData} onClick={handleReset}>
        この端末のデータを初期化
      </button>

      {message ? <p className="text-sm text-moss">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
