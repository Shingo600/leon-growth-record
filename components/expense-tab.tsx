"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "@/components/app-provider";
import { ExpenseCategory, ExpenseRecord } from "@/lib/types";
import { formatDate, sumByCategory } from "@/lib/utils";

const categories: ExpenseCategory[] = [
  "フード",
  "病院",
  "トリミング",
  "消耗品",
  "おもちゃ",
  "保険",
  "その他"
];

const categoryTone: Record<ExpenseCategory, string> = {
  フード: "bg-orange-50 text-orange-700",
  病院: "bg-sky-50 text-sky-700",
  トリミング: "bg-violet-50 text-violet-700",
  消耗品: "bg-emerald-50 text-emerald-700",
  おもちゃ: "bg-rose-50 text-rose-700",
  保険: "bg-teal-50 text-teal-700",
  その他: "bg-stone-100 text-stone-700"
};

const categoryBar: Record<ExpenseCategory, string> = {
  フード: "bg-orange-400",
  病院: "bg-sky-500",
  トリミング: "bg-violet-500",
  消耗品: "bg-emerald-500",
  おもちゃ: "bg-rose-400",
  保険: "bg-teal-500",
  その他: "bg-stone-400"
};

type ExpenseFormState = {
  date: string;
  category: ExpenseCategory;
  itemName: string;
  amount: string;
  payee: string;
  memo: string;
};

const initialFormState = (): ExpenseFormState => ({
  date: new Date().toISOString().slice(0, 10),
  category: "フード",
  itemName: "",
  amount: "1000",
  payee: "",
  memo: ""
});

function toFormState(record?: ExpenseRecord): ExpenseFormState {
  if (!record) {
    return initialFormState();
  }

  return {
    date: record.date,
    category: record.category,
    itemName: record.itemName,
    amount: String(record.amount),
    payee: record.payee,
    memo: record.memo
  };
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function ExpenseTab() {
  const { data, addExpenseRecord, updateExpenseRecord, deleteExpenseRecord } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(initialFormState);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "すべて">("すべて");
  const [searchText, setSearchText] = useState("");

  const now = new Date();
  const monthKey = getMonthKey(now);
  const previousMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const currentMonthRecords = useMemo(
    () => data.expenseRecords.filter((item) => item.date.startsWith(monthKey)),
    [data.expenseRecords, monthKey]
  );

  const previousMonthTotal = data.expenseRecords
    .filter((item) => item.date.startsWith(previousMonthKey))
    .reduce((sum, item) => sum + item.amount, 0);
  const monthTotal = currentMonthRecords.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = sumByCategory(currentMonthRecords);
  const topCategory = categories
    .map((category) => ({ category, amount: categoryTotals[category] }))
    .sort((a, b) => b.amount - a.amount)[0];
  const previousMonthDiffRate =
    previousMonthTotal > 0 ? Math.round(((monthTotal - previousMonthTotal) / previousMonthTotal) * 100) : 0;

  const categoryRows = categories.map((category) => ({ category, amount: categoryTotals[category] }));

  const monthChartData = useMemo(() => {
    const map = new Map<string, number>();
    data.expenseRecords.forEach((item) => {
      const key = item.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + item.amount);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({ month: month.replace("-", "/"), amount }));
  }, [data.expenseRecords]);

  const filteredRecords = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return data.expenseRecords.filter((item) => {
      const matchesCategory = categoryFilter === "すべて" || item.category === categoryFilter;
      const matchesKeyword =
        keyword.length === 0 ||
        item.itemName.toLowerCase().includes(keyword) ||
        item.payee.toLowerCase().includes(keyword) ||
        item.memo.toLowerCase().includes(keyword) ||
        item.date.includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [categoryFilter, data.expenseRecords, searchText]);

  const recentRecords = data.expenseRecords.slice(0, 5);
  const memoRecords = data.expenseRecords.filter((item) => item.memo.trim()).slice(0, 3);

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(initialFormState());
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm(initialFormState());
    setOpen(true);
  };

  const openEditModal = (record: ExpenseRecord) => {
    setEditingId(record.id);
    setForm(toFormState(record));
    setOpen(true);
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">毎月のレオン費を、ざっくりでも続けやすく。</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">費用管理</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">フード、病院、トリミングなどの支出を一画面で確認できます。</p>
        </div>
        <button type="button" className="button-primary" onClick={openNewModal}>
          費用を追加
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="今月の合計" value={`¥${monthTotal.toLocaleString()}`} detail="今月の支出合計" tone="indigo" />
        <SummaryCard
          label="最大カテゴリ"
          value={topCategory && topCategory.amount > 0 ? topCategory.category : "未記録"}
          detail={topCategory && topCategory.amount > 0 ? `¥${topCategory.amount.toLocaleString()}` : "費用を追加すると表示"}
          tone="amber"
        />
        <SummaryCard label="記録件数" value={`${currentMonthRecords.length}件`} detail="今月の明細数" tone="emerald" />
        <SummaryCard
          label="前月比"
          value={previousMonthTotal > 0 ? `${previousMonthDiffRate >= 0 ? "+" : ""}${previousMonthDiffRate}%` : "未比較"}
          detail={previousMonthTotal > 0 ? `前月 ¥${previousMonthTotal.toLocaleString()}` : "前月データがありません"}
          tone="rose"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">月別の支出推移</h3>
                  <p className="mt-1 text-sm text-ink/60">直近6か月の合計を確認できます。</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">今月</span>
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthChartData}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card space-y-4 p-5">
              <h3 className="text-lg font-bold">カテゴリ別の内訳</h3>
              {categoryRows.map((row) => {
                const rate = monthTotal > 0 ? (row.amount / monthTotal) * 100 : 0;
                return (
                  <button
                    key={row.category}
                    type="button"
                    className="w-full space-y-2 text-left"
                    onClick={() => setCategoryFilter(row.category)}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${categoryTone[row.category]}`}>{row.category}</span>
                      <span className="font-bold">¥{row.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream">
                      <div className={`h-full rounded-full ${categoryBar[row.category]}`} style={{ width: `${rate}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">費用一覧</h3>
                <p className="mt-1 text-sm text-ink/60">内容・支払先・メモから検索できます。</p>
              </div>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-sm"
                onClick={() => {
                  setCategoryFilter("すべて");
                  setSearchText("");
                }}
              >
                リセット
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
              <select
                className="input"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as ExpenseCategory | "すべて")}
              >
                <option value="すべて">すべてのカテゴリ</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="search"
                placeholder="内容・支払先・メモ・日付で検索"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["すべて", ...categories] as Array<ExpenseCategory | "すべて">).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    categoryFilter === category ? "bg-indigo-600 text-white" : "bg-white text-ink/70 ring-1 ring-line"
                  }`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-3">
                {filteredRecords.map((item) => (
                  <ExpenseListCard
                    key={item.id}
                    item={item}
                    onEdit={() => openEditModal(item)}
                    onDelete={() => {
                      if (window.confirm("この費用明細を削除しますか？")) {
                        deleteExpenseRecord(item.id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-cream px-5 py-8 text-center">
                <p className="text-lg font-bold">条件に合う費用明細がありません</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">検索条件を変えるか、新しい費用を追加してください。</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-600">今月のメモ</p>
                <h3 className="mt-1 text-xl font-bold">支出のひとこと</h3>
              </div>
              <button type="button" className="text-sm font-bold text-indigo-600" onClick={openNewModal}>
                追加
              </button>
            </div>
            {memoRecords.length > 0 ? (
              <div className="space-y-2">
                {memoRecords.map((item) => (
                  <button key={item.id} type="button" className="w-full rounded-2xl bg-cream px-4 py-3 text-left" onClick={() => openEditModal(item)}>
                    <p className="text-xs font-bold text-ink/45">{formatDate(item.date)} / {item.category}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink/70">{item.memo}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-ink/60">
                「まとめ買い」「病院代」などを残すと、あとで見返しやすくなります。
              </p>
            )}
          </section>

          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-600">最近の明細</p>
                <h3 className="mt-1 text-xl font-bold">直近の支出</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {recentRecords.length}件
              </span>
            </div>
            {recentRecords.length > 0 ? (
              <div className="space-y-2">
                {recentRecords.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left"
                    onClick={() => openEditModal(item)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.itemName}</p>
                      <p className="mt-1 text-xs text-ink/50">{formatDate(item.date)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">¥{item.amount.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-ink/60">費用明細はまだありません。</p>
            )}
          </section>
        </aside>
      </section>

      {open ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/35 px-4 py-8">
          <div className="mx-auto max-w-md rounded-4xl bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">{editingId ? "費用を編集" : "費用を追加"}</h3>
              <button type="button" className="button-secondary px-4 py-2" onClick={closeModal}>
                閉じる
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();

                const payload = {
                  date: form.date,
                  category: form.category,
                  itemName: form.itemName,
                  amount: Number(form.amount),
                  payee: form.payee,
                  memo: form.memo
                };

                if (editingId) {
                  updateExpenseRecord(editingId, payload);
                } else {
                  addExpenseRecord(payload);
                }

                closeModal();
              }}
            >
              <div>
                <label className="label" htmlFor="expense-date">
                  日付
                </label>
                <input
                  id="expense-date"
                  className="input date-input"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="expense-category">
                  カテゴリ
                </label>
                <select
                  id="expense-category"
                  className="input"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="expense-item-name">
                  品名
                </label>
                <input
                  id="expense-item-name"
                  className="input"
                  type="text"
                  placeholder="例: トリミング"
                  value={form.itemName}
                  onChange={(event) => setForm((current) => ({ ...current, itemName: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="expense-amount">
                  金額
                </label>
                <input
                  id="expense-amount"
                  className="input"
                  type="number"
                  min="0"
                  placeholder="例: 6500"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="expense-payee">
                  支払先
                </label>
                <input
                  id="expense-payee"
                  className="input"
                  type="text"
                  placeholder="例: 動物病院"
                  value={form.payee}
                  onChange={(event) => setForm((current) => ({ ...current, payee: event.target.value }))}
                />
              </div>

              <div>
                <label className="label" htmlFor="expense-memo">
                  メモ
                </label>
                <textarea
                  id="expense-memo"
                  className="input min-h-24 resize-none"
                  placeholder="補足があれば記録"
                  value={form.memo}
                  onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
                />
              </div>

              <button className="button-primary w-full" type="submit">
                {editingId ? "更新する" : "保存する"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
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
  tone: "indigo" | "amber" | "emerald" | "rose";
}) {
  const toneClassName = {
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700"
  }[tone];

  return (
    <article className="card p-5">
      <p className={`inline-flex rounded-2xl px-3 py-1 text-xs font-bold ${toneClassName}`}>{label}</p>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{detail}</p>
    </article>
  );
}

function ExpenseListCard({
  item,
  onEdit,
  onDelete
}: {
  item: ExpenseRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-3xl border border-line bg-white p-4 shadow-[0_12px_30px_-28px_rgba(47,42,37,0.55)]">
      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_140px_150px] md:items-center">
        <div>
          <p className="text-base font-bold">
            {formatDate(item.date, { year: "numeric", month: "numeric", day: "numeric", weekday: "short" })}
          </p>
        </div>
        <div className="min-w-0">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${categoryTone[item.category]}`}>{item.category}</span>
          <h3 className="mt-2 text-lg font-bold">{item.itemName}</h3>
          <p className="mt-1 text-sm text-ink/55">{item.payee || "支払先未入力"}</p>
          {item.memo ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/70">{item.memo}</p> : null}
        </div>
        <p className="text-xl font-bold md:text-right">¥{item.amount.toLocaleString()}</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
          <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={onEdit}>
            編集
          </button>
          <button type="button" className="button-secondary w-full px-3 py-2 text-sm" onClick={onDelete}>
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
