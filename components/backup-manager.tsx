"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppData } from "@/components/app-provider";
import { createBackupData, parseBackupData } from "@/lib/storage";

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
  const { data, replaceData } = useAppData();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleExport() {
    const backup = createBackupData(data);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`leon-growth-record-backup-${dateStamp}.json`, JSON.stringify(backup, null, 2));
    setError("");
    setMessage("バックアップファイルを書き出しました。");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await readFileText(file);
      const parsed = parseBackupData(text);

      if (!parsed.ok) {
        setMessage("");
        setError(parsed.message);
        return;
      }

      const confirmed = window.confirm("現在のデータをバックアップファイルの内容で上書きします。よろしいですか？");
      if (!confirmed) {
        return;
      }

      replaceData(parsed.data);
      setError("");
      setMessage("バックアップから復元しました。");
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
        <h3 className="text-lg font-semibold">バックアップ</h3>
        <p className="mt-1 text-sm leading-6 text-ink/60">
          現在のプロフィール、成長記録、予定、健康履歴をJSONで書き出し、あとから復元できます。
        </p>
      </div>

      <button type="button" className="button-primary w-full" onClick={handleExport}>
        バックアップを書き出す
      </button>

      <div>
        <label className="label" htmlFor="backup-import">バックアップを復元</label>
        <input
          id="backup-import"
          className="input file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
        />
        <p className="mt-2 text-xs leading-5 text-ink/55">
          復元すると現在のデータを上書きします。復元前にバックアップを書き出しておくのがおすすめです。
        </p>
      </div>

      {message ? <p className="text-sm text-moss">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
