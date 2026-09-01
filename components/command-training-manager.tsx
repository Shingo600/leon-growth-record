"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/app-provider";
import type {
  CommandCueType,
  CommandFocusLevel,
  CommandPracticeRecord,
  CommandStatus,
  DogCommand
} from "@/lib/types";
import { formatDate, getTodayDateString } from "@/lib/utils";

const statusOptions: CommandStatus[] = ["練習中", "ほぼOK", "習得"];
const cueOptions: CommandCueType[] = ["声", "手", "両方"];
const focusOptions: CommandFocusLevel[] = ["高い", "普通", "低い"];

type CommandFormState = {
  name: string;
  status: CommandStatus;
  cueType: CommandCueType;
  memo: string;
};

type PracticeFormState = {
  date: string;
  commandId: string;
  durationMinutes: string;
  attempts: string;
  successes: string;
  focusLevel: CommandFocusLevel;
  memo: string;
};

function getNowTimeString() {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

function buildCommandStats(command: DogCommand, practiceRecords: CommandPracticeRecord[]) {
  const records = practiceRecords.filter((record) => record.commandId === command.id);
  const attempts = records.reduce((sum, record) => sum + record.attempts, 0);
  const successes = records.reduce((sum, record) => sum + record.successes, 0);
  const latestDate = records[0]?.date || command.lastPracticedDate;

  return {
    attempts,
    successRate: attempts > 0 ? Math.round((successes / attempts) * 100) : command.successRate,
    latestDate
  };
}

function getStatusBadgeClassName(status: CommandStatus) {
  switch (status) {
    case "習得":
      return "bg-emerald-50 text-emerald-700";
    case "ほぼOK":
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-indigo-50 text-indigo-700";
  }
}

function getFocusBadgeClassName(focusLevel: CommandFocusLevel) {
  switch (focusLevel) {
    case "高い":
      return "bg-emerald-50 text-emerald-700";
    case "低い":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-indigo-50 text-indigo-700";
  }
}

function CommandForm({
  initialCommand,
  onCancel
}: {
  initialCommand?: DogCommand | null;
  onCancel?: () => void;
}) {
  const { addDogCommand, updateDogCommand } = useAppData();
  const [form, setForm] = useState<CommandFormState>({
    name: initialCommand?.name ?? "",
    status: initialCommand?.status ?? "練習中",
    cueType: initialCommand?.cueType ?? "声",
    memo: initialCommand?.memo ?? ""
  });

  return (
    <form
      className="space-y-4 rounded-3xl bg-cream p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const name = form.name.trim();
        if (!name) {
          return;
        }

        const payload = {
          name,
          status: form.status,
          cueType: form.cueType,
          successRate: initialCommand?.successRate ?? 0,
          lastPracticedDate: initialCommand?.lastPracticedDate ?? "",
          memo: form.memo.trim()
        };

        if (initialCommand) {
          updateDogCommand(initialCommand.id, payload);
          onCancel?.();
          return;
        }

        addDogCommand(payload);
        setForm({ name: "", status: "練習中", cueType: "声", memo: "" });
      }}
    >
      <div>
        <label className="label" htmlFor={initialCommand ? `command-name-${initialCommand.id}` : "command-name-new"}>
          コマンド名
        </label>
        <input
          id={initialCommand ? `command-name-${initialCommand.id}` : "command-name-new"}
          className="input"
          value={form.name}
          placeholder="例: おすわり"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor={initialCommand ? `command-status-${initialCommand.id}` : "command-status-new"}>
            状態
          </label>
          <select
            id={initialCommand ? `command-status-${initialCommand.id}` : "command-status-new"}
            className="input"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CommandStatus }))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor={initialCommand ? `command-cue-${initialCommand.id}` : "command-cue-new"}>
            合図
          </label>
          <select
            id={initialCommand ? `command-cue-${initialCommand.id}` : "command-cue-new"}
            className="input"
            value={form.cueType}
            onChange={(event) => setForm((current) => ({ ...current, cueType: event.target.value as CommandCueType }))}
          >
            {cueOptions.map((cue) => (
              <option key={cue} value={cue}>
                {cue}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={initialCommand ? `command-memo-${initialCommand.id}` : "command-memo-new"}>
          メモ
        </label>
        <textarea
          id={initialCommand ? `command-memo-${initialCommand.id}` : "command-memo-new"}
          className="input min-h-20 resize-none"
          value={form.memo}
          placeholder="得意な状況や注意点"
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </div>

      <div className={`grid gap-3 ${initialCommand ? "grid-cols-2" : "grid-cols-1"}`}>
        {initialCommand ? (
          <button type="button" className="button-secondary w-full" onClick={onCancel}>
            閉じる
          </button>
        ) : null}
        <button type="submit" className="button-primary w-full">
          {initialCommand ? "更新する" : "コマンドを追加"}
        </button>
      </div>
    </form>
  );
}

function PracticeForm({ editingRecord, onCancel }: { editingRecord?: CommandPracticeRecord | null; onCancel?: () => void }) {
  const {
    addCommandPracticeRecord,
    data,
    incrementActivity,
    updateCommandPracticeRecord
  } = useAppData();
  const [form, setForm] = useState<PracticeFormState>({
    date: editingRecord?.date ?? getTodayDateString(),
    commandId: editingRecord?.commandId ?? data.dogCommands[0]?.id ?? "",
    durationMinutes: String(editingRecord?.durationMinutes ?? 5),
    attempts: String(editingRecord?.attempts ?? 5),
    successes: String(editingRecord?.successes ?? 5),
    focusLevel: editingRecord?.focusLevel ?? "普通",
    memo: editingRecord?.memo ?? ""
  });

  const canSubmit = Boolean(form.commandId) && Number(form.durationMinutes) >= 0 && Number(form.attempts) >= Number(form.successes);

  return (
    <form
      className="space-y-4 rounded-3xl bg-cream p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }

        const payload = {
          date: form.date,
          commandId: form.commandId,
          durationMinutes: Math.max(Number(form.durationMinutes), 0),
          attempts: Math.max(Number(form.attempts), 0),
          successes: Math.max(Number(form.successes), 0),
          focusLevel: form.focusLevel,
          memo: form.memo.trim()
        };

        if (editingRecord) {
          updateCommandPracticeRecord(editingRecord.id, payload);
          onCancel?.();
          return;
        }

        addCommandPracticeRecord(payload);
        if (payload.durationMinutes > 0) {
          incrementActivity(payload.date, "トレーニング", "コマンド練習", payload.durationMinutes);
        }
        setForm((current) => ({
          ...current,
          durationMinutes: "5",
          attempts: "5",
          successes: "5",
          memo: ""
        }));
      }}
    >
      <div>
        <label className="label" htmlFor={editingRecord ? `practice-command-${editingRecord.id}` : "practice-command-new"}>
          練習したコマンド
        </label>
        <select
          id={editingRecord ? `practice-command-${editingRecord.id}` : "practice-command-new"}
          className="input"
          value={form.commandId}
          onChange={(event) => setForm((current) => ({ ...current, commandId: event.target.value }))}
          disabled={data.dogCommands.length === 0}
        >
          {data.dogCommands.map((command) => (
            <option key={command.id} value={command.id}>
              {command.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor={editingRecord ? `practice-date-${editingRecord.id}` : "practice-date-new"}>
            日付
          </label>
          <input
            id={editingRecord ? `practice-date-${editingRecord.id}` : "practice-date-new"}
            className="input date-input"
            type="date"
            value={form.date}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor={editingRecord ? `practice-minutes-${editingRecord.id}` : "practice-minutes-new"}>
            時間
          </label>
          <input
            id={editingRecord ? `practice-minutes-${editingRecord.id}` : "practice-minutes-new"}
            className="input"
            type="number"
            min="0"
            inputMode="numeric"
            value={form.durationMinutes}
            onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value.replace(/[^\d]/g, "") }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor={editingRecord ? `practice-attempts-${editingRecord.id}` : "practice-attempts-new"}>
            回数
          </label>
          <input
            id={editingRecord ? `practice-attempts-${editingRecord.id}` : "practice-attempts-new"}
            className="input"
            type="number"
            min="0"
            inputMode="numeric"
            value={form.attempts}
            onChange={(event) => setForm((current) => ({ ...current, attempts: event.target.value.replace(/[^\d]/g, "") }))}
          />
        </div>
        <div>
          <label className="label" htmlFor={editingRecord ? `practice-successes-${editingRecord.id}` : "practice-successes-new"}>
            成功
          </label>
          <input
            id={editingRecord ? `practice-successes-${editingRecord.id}` : "practice-successes-new"}
            className="input"
            type="number"
            min="0"
            inputMode="numeric"
            value={form.successes}
            onChange={(event) => setForm((current) => ({ ...current, successes: event.target.value.replace(/[^\d]/g, "") }))}
          />
        </div>
        <div>
          <label className="label" htmlFor={editingRecord ? `practice-focus-${editingRecord.id}` : "practice-focus-new"}>
            集中
          </label>
          <select
            id={editingRecord ? `practice-focus-${editingRecord.id}` : "practice-focus-new"}
            className="input"
            value={form.focusLevel}
            onChange={(event) => setForm((current) => ({ ...current, focusLevel: event.target.value as CommandFocusLevel }))}
          >
            {focusOptions.map((focus) => (
              <option key={focus} value={focus}>
                {focus}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "5回全部できた", attempts: "5", successes: "5" },
          { label: "10回中8回", attempts: "10", successes: "8" },
          { label: "今日は軽め", attempts: "3", successes: "3" }
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/75"
            onClick={() => setForm((current) => ({ ...current, attempts: preset.attempts, successes: preset.successes }))}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor={editingRecord ? `practice-memo-${editingRecord.id}` : "practice-memo-new"}>
          メモ
        </label>
        <textarea
          id={editingRecord ? `practice-memo-${editingRecord.id}` : "practice-memo-new"}
          className="input min-h-20 resize-none"
          value={form.memo}
          placeholder="できたこと、苦手だった場面など"
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        />
      </div>

      {!canSubmit ? <p className="text-sm font-semibold text-rose-700">成功回数は回数以下で入力してください。</p> : null}

      <div className={`grid gap-3 ${editingRecord ? "grid-cols-2" : "grid-cols-1"}`}>
        {editingRecord ? (
          <button type="button" className="button-secondary w-full" onClick={onCancel}>
            閉じる
          </button>
        ) : null}
        <button type="submit" className="button-primary w-full disabled:opacity-50" disabled={!canSubmit || data.dogCommands.length === 0}>
          {editingRecord ? "更新する" : "練習を記録"}
        </button>
      </div>
    </form>
  );
}

export function CommandTrainingManager() {
  const { data, deleteCommandPracticeRecord, deleteDogCommand } = useAppData();
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [showCommandForm, setShowCommandForm] = useState(false);

  const todaysPractices = data.commandPracticeRecords.filter((record) => record.date === getTodayDateString());
  const totalTodayMinutes = todaysPractices.reduce((sum, record) => sum + record.durationMinutes, 0);
  const masteredCount = data.dogCommands.filter((command) => command.status === "習得").length;
  const almostCount = data.dogCommands.filter((command) => command.status === "ほぼOK").length;
  const trainingCommands = data.dogCommands.filter((command) => command.status !== "習得");
  const editingCommand = data.dogCommands.find((command) => command.id === editingCommandId);
  const editingPractice = data.commandPracticeRecords.find((record) => record.id === editingPracticeId);

  return (
    <div className="space-y-5">
      <section className="grid overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-card md:grid-cols-2">
        <div className="border-b border-line bg-gradient-to-r from-indigo-50 to-white p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-center gap-3 text-indigo-700">
            <span className="text-2xl" aria-hidden="true">✣</span>
            <h2 className="text-2xl font-bold">覚えたコマンド</h2>
          </div>
          <div className="mx-auto mt-4 h-1 max-w-44 rounded-full bg-indigo-600" />
        </div>
        <div className="bg-gradient-to-r from-cream to-white p-5">
          <div className="flex items-center justify-center gap-3 text-ink/70">
            <span className="text-2xl" aria-hidden="true">▤</span>
            <h2 className="text-2xl font-bold">コマンド習得中</h2>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.95fr)]">
        <section className="card space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-600">覚えたコマンド一覧</p>
              <h3 className="mt-1 text-2xl font-bold">コマンドを管理</h3>
            </div>
            <button type="button" className="button-primary px-4 py-3" onClick={() => setShowCommandForm((current) => !current)}>
              {showCommandForm ? "追加を閉じる" : "+ コマンド追加"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 px-4 py-4">
              <p className="text-xs font-semibold text-emerald-700">覚えたコマンド</p>
              <p className="mt-2 text-3xl font-bold text-emerald-800">{masteredCount}<span className="text-base">個</span></p>
            </div>
            <div className="rounded-3xl bg-sky-50 px-4 py-4">
              <p className="text-xs font-semibold text-sky-700">得意なコマンド</p>
              <p className="mt-2 text-3xl font-bold text-sky-800">{almostCount}<span className="text-base">個</span></p>
            </div>
            <div className="rounded-3xl bg-amber-50 px-4 py-4">
              <p className="text-xs font-semibold text-amber-700">今日の特訓</p>
              <p className="mt-2 text-3xl font-bold text-amber-800">{totalTodayMinutes}<span className="text-base">分</span></p>
            </div>
          </div>

          {showCommandForm ? <CommandForm /> : null}

          {data.dogCommands.length > 0 ? (
            <div className="space-y-3">
              {data.dogCommands.map((command) => {
                const stats = buildCommandStats(command, data.commandPracticeRecords);
                const isEditing = editingCommandId === command.id;

                return (
                  <div key={command.id} className="rounded-3xl border border-line bg-white p-4 shadow-[0_12px_30px_-26px_rgba(47,42,37,0.5)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl" aria-hidden="true">
                        🐾
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xl font-bold">{command.name}</p>
                            <p className="mt-1 text-sm text-ink/60">{command.memo || "少しずつ成功体験を増やします。"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-ink/50">習得日</p>
                            <p className="text-sm font-semibold text-ink/75">
                              {stats.latestDate ? formatDate(stats.latestDate, { year: "numeric", month: "2-digit", day: "2-digit" }) : "未記録"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClassName(command.status)}`}>
                            {command.status}
                          </span>
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">合図 {command.cueType}</span>
                          <span className="ml-auto rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/70">成功率 {stats.successRate}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
                          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(stats.successRate, 100)}%` }} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setEditingCommandId(isEditing ? null : command.id)}>
                            編集
                          </button>
                          <button
                            type="button"
                            className="button-secondary w-full px-3 py-2 text-sm"
                            onClick={() => {
                              if (window.confirm(`${command.name} と関連する練習記録を削除しますか？`)) {
                                deleteDogCommand(command.id);
                              }
                            }}
                          >
                            削除
                          </button>
                        </div>
                        {isEditing && editingCommand ? (
                          <div className="mt-3">
                            <CommandForm initialCommand={editingCommand} onCancel={() => setEditingCommandId(null)} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-3xl bg-cream px-4 py-6 text-center text-sm leading-6 text-ink/60">
              まずは「おすわり」など、今練習しているコマンドを1つ登録しましょう。
            </p>
          )}
        </section>

        <div className="space-y-5">
          <section className="card space-y-5 p-5 md:p-6">
            <div>
              <p className="text-sm font-semibold text-indigo-600">コマンド習得・トレーニング計画</p>
              <h3 className="mt-1 text-2xl font-bold">今日の練習を記録</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded-3xl bg-indigo-50 px-4 py-4">
                <p className="text-xs font-semibold text-indigo-700">習得中のコマンド</p>
                <p className="mt-2 text-3xl font-bold text-indigo-800">{trainingCommands.length}<span className="text-base">個</span></p>
              </div>
              <div className="rounded-3xl bg-orange-50 px-4 py-4">
                <p className="text-xs font-semibold text-orange-700">連続トレーニング</p>
                <p className="mt-2 text-3xl font-bold text-orange-800">{todaysPractices.length > 0 ? "1" : "0"}<span className="text-base">日</span></p>
              </div>
              <div className="rounded-3xl bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold text-emerald-700">次の練習予定</p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">今日</p>
              </div>
            </div>

            <PracticeForm />
          </section>

          <section className="card space-y-4 p-5 md:p-6">
            <h3 className="text-xl font-bold">習得中リスト</h3>
            {trainingCommands.length > 0 ? (
              <div className="space-y-3">
                {trainingCommands.slice(0, 4).map((command) => {
                  const stats = buildCommandStats(command, data.commandPracticeRecords);

                  return (
                    <div key={command.id} className="rounded-3xl border border-line bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold">{command.name}</p>
                          <p className="mt-1 text-sm text-ink/60">合図 {command.cueType}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClassName(command.status)}`}>
                          {command.status}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(stats.successRate, 100)}%` }} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink/65">成功率 {stats.successRate}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-700">
                登録済みコマンドはすべて習得扱いです。レオン、かなり優秀です。
              </p>
            )}
          </section>
        </div>
      </div>

      <section className="card space-y-4 p-5 md:p-6">
        <h3 className="text-xl font-bold">特訓履歴</h3>
        {data.commandPracticeRecords.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.commandPracticeRecords.map((record) => {
              const command = data.dogCommands.find((item) => item.id === record.commandId);
              const successRate = record.attempts > 0 ? Math.round((record.successes / record.attempts) * 100) : 0;
              const isEditing = editingPracticeId === record.id;

              return (
                <section key={record.id} className="space-y-3 rounded-3xl border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink/55">{formatDate(record.date, { year: "numeric", month: "numeric", day: "numeric" })}</p>
                      <h4 className="mt-1 text-xl font-bold">{command?.name ?? "削除済みコマンド"}</h4>
                      <p className="mt-1 text-sm text-ink/65">
                        {record.durationMinutes}分 / {record.successes}回成功 / {record.attempts}回中
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">{successRate}%</span>
                  </div>

                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getFocusBadgeClassName(record.focusLevel)}`}>
                    集中度 {record.focusLevel}
                  </span>
                  {record.memo ? <p className="rounded-3xl bg-cream px-4 py-3 text-sm leading-6 text-ink/65">{record.memo}</p> : null}

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={() => setEditingPracticeId(isEditing ? null : record.id)}>
                      編集
                    </button>
                    <button
                      type="button"
                      className="button-secondary w-full px-3 py-2 text-sm"
                      onClick={() => {
                        if (window.confirm("この練習記録を削除しますか？")) {
                          deleteCommandPracticeRecord(record.id);
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>

                  {isEditing && editingPractice ? (
                    <PracticeForm editingRecord={editingPractice} onCancel={() => setEditingPracticeId(null)} />
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <section className="rounded-3xl bg-cream p-5 text-sm leading-6 text-ink/60">
            まだ特訓履歴はありません。短くできた日だけでも残していきましょう。
          </section>
        )}
      </section>
    </div>
  );
}
