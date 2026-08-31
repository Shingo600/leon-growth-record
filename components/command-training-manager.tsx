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

  const todaysPractices = data.commandPracticeRecords.filter((record) => record.date === getTodayDateString());
  const totalTodayMinutes = todaysPractices.reduce((sum, record) => sum + record.durationMinutes, 0);
  const masteredCount = data.dogCommands.filter((command) => command.status === "習得").length;
  const editingCommand = data.dogCommands.find((command) => command.id === editingCommandId);
  const editingPractice = data.commandPracticeRecords.find((record) => record.id === editingPracticeId);

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="text-sm text-ink/60">コマンド特訓</p>
        <h2 className="mt-1 text-2xl font-semibold">できることを楽しく増やす</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-3xl bg-cream px-3 py-4 text-center">
            <p className="text-xs text-ink/55">登録</p>
            <p className="text-2xl font-semibold">{data.dogCommands.length}</p>
          </div>
          <div className="rounded-3xl bg-cream px-3 py-4 text-center">
            <p className="text-xs text-ink/55">習得</p>
            <p className="text-2xl font-semibold">{masteredCount}</p>
          </div>
          <div className="rounded-3xl bg-cream px-3 py-4 text-center">
            <p className="text-xs text-ink/55">今日</p>
            <p className="text-2xl font-semibold">{totalTodayMinutes}分</p>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <p className="text-sm text-ink/60">覚えたコマンド一覧</p>
          <h3 className="mt-1 text-xl font-semibold">コマンドを管理</h3>
        </div>

        <CommandForm />

        {data.dogCommands.length > 0 ? (
          <div className="space-y-3">
            {data.dogCommands.map((command) => {
              const stats = buildCommandStats(command, data.commandPracticeRecords);
              const isEditing = editingCommandId === command.id;

              return (
                <div key={command.id} className="rounded-3xl bg-cream p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold">{command.name}</p>
                      <p className="mt-1 text-sm text-ink/60">
                        {command.status} / 合図 {command.cueType}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-right">
                      <p className="text-xs text-ink/55">成功率</p>
                      <p className="text-lg font-semibold">{stats.successRate}%</p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(stats.successRate, 100)}%` }} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    最終練習: {stats.latestDate ? formatDate(stats.latestDate, { year: "numeric", month: "numeric", day: "numeric" }) : "まだなし"}
                  </p>
                  {command.memo ? <p className="mt-2 rounded-2xl bg-white/70 px-3 py-2 text-sm leading-6 text-ink/65">{command.memo}</p> : null}

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
              );
            })}
          </div>
        ) : (
          <p className="rounded-3xl bg-cream px-4 py-4 text-sm leading-6 text-ink/60">
            まずは「おすわり」など、今練習しているコマンドを1つ登録しましょう。
          </p>
        )}
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <p className="text-sm text-ink/60">今日の特訓</p>
          <h3 className="mt-1 text-xl font-semibold">練習を記録</h3>
        </div>
        <PracticeForm />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">特訓履歴</h3>
        {data.commandPracticeRecords.length > 0 ? (
          data.commandPracticeRecords.map((record) => {
            const command = data.dogCommands.find((item) => item.id === record.commandId);
            const successRate = record.attempts > 0 ? Math.round((record.successes / record.attempts) * 100) : 0;
            const isEditing = editingPracticeId === record.id;

            return (
              <section key={record.id} className="card space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink/55">{formatDate(record.date, { year: "numeric", month: "numeric", day: "numeric" })}</p>
                    <h4 className="mt-1 text-xl font-semibold">{command?.name ?? "削除済みコマンド"}</h4>
                    <p className="mt-1 text-sm text-ink/65">
                      {record.durationMinutes}分 / {record.successes}回成功 / {record.attempts}回中
                    </p>
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-ink/70">{successRate}%</span>
                </div>

                <p className="text-sm text-ink/60">集中度: {record.focusLevel}</p>
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
          })
        ) : (
          <section className="card p-5 text-sm leading-6 text-ink/60">
            まだ特訓履歴はありません。短くできた日だけでも残していきましょう。
          </section>
        )}
      </section>
    </div>
  );
}
