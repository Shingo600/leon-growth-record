"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppData } from "@/components/app-provider";
import { sampleAppData } from "@/lib/dummy-data";
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

  function handleSampleLoad() {
    if (!window.confirm("サンプルデータをこの端末に読み込みます。現在のデータは上書きされます。よろしいですか？")) {
      return;
    }

    replaceData(sampleAppData);
    setError("");
    setMessage("サンプルデータを読み込みました。");
  }

  function handleReset() {
    if (!window.confirm("この端末のデータを空の状態に戻します。よろしいですか？")) {
      return;
    }

    replaceData({
      ...sampleAppData,
      profile: {
        ...sampleAppData.profile,
        breed: "",
        birthday: "",
        arrivalDate: "",
        currentWeight: 0,
        photoUrl: "",
        catchPhrase: "今日もやさしく見守ろう"
      },
      records: [],
      events: [],
      healthRecords: [],
      activityRecords: [],
      mealRecords: [],
      foodItems: [],
      expenseRecords: []
    });
    setError("");
    setMessage("この端末のデータを初期化しました。");
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
        <h3 className="text-lg font-semibold">データ管理</h3>
        <p className="mt-1 text-sm leading-6 text-ink/60">
          このアプリは今のところ端末ごとに保存されます。PCと携帯で同じデータにしたいときは、バックアップを書き出して復元してください。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="button-primary w-full" onClick={handleExport}>
          バックアップを書き出す
        </button>
        <button type="button" className="button-secondary w-full" onClick={handleSampleLoad}>
          サンプルデータを入れる
        </button>
      </div>

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
          先にバックアップを書き出してから復元するのがおすすめです。
        </p>
      </div>

      <button type="button" className="button-secondary w-full" onClick={handleReset}>
        この端末のデータを初期化
      </button>

      {message ? <p className="text-sm text-moss">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
