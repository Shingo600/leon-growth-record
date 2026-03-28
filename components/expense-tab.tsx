"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "@/components/app-provider";
import { ExpenseCategory, ExpenseRecord } from "@/lib/types";
import { sumByCategory } from "@/lib/utils";

const categories: ExpenseCategory[] = [
  "フード",
  "病院",
  "トリミング",
  "消耗品",
  "おもちゃ",
  "保険",
  "その他"
];

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

export function ExpenseTab() {
  const { data, addExpenseRecord, updateExpenseRecord, deleteExpenseRecord } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(initialFormState);

  const currentMonthRecords = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
    return data.expenseRecords.filter((item) => item.date.startsWith(monthKey));
  }, [data.expenseRecords]);

  const monthTotal = currentMonthRecords.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = sumByCategory(currentMonthRecords);
  const categoryRows = categories.map((category) => ({ category, amount: categoryTotals[category] }));

  const monthChartData = useMemo(() => {
    const map = new Map<string, number>();
    data.expenseRecords.forEach((item) => {
      const key = item.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + item.amount);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));
  }, [data.expenseRecords]);

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
      <section className="card space-y-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink/60">今月の合計費用</p>
            <h2 className="mt-1 text-3xl font-semibold">¥{monthTotal.toLocaleString()}</h2>
          </div>
          <button type="button" className="button-primary" onClick={openNewModal}>
            費用を追加
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-lg font-semibold">月別の費用推移</h3>
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthChartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#c98b61" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h3 className="text-lg font-semibold">カテゴリ別内訳</h3>
        {categoryRows.map((row) => {
          const rate = monthTotal > 0 ? (row.amount / monthTotal) * 100 : 0;
          return (
            <div key={row.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{row.category}</span>
                <span>¥{row.amount.toLocaleString()}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full bg-moss" style={{ width: `${rate}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">明細一覧</h3>
        {data.expenseRecords.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink/55">{item.date}</p>
                <p className="mt-1 text-lg font-semibold">{item.itemName}</p>
                <p className="mt-1 text-sm text-ink/65">{item.payee || "支払先未入力"}</p>
              </div>
              <div className="text-right">
                <p className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/70">{item.category}</p>
                <p className="mt-2 text-xl font-semibold">¥{item.amount.toLocaleString()}</p>
              </div>
            </div>
            {item.memo ? <p className="mt-3 text-sm text-ink/70">{item.memo}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" className="button-secondary w-full" onClick={() => openEditModal(item)}>
                編集
              </button>
              <button
                type="button"
                className="button-secondary w-full"
                onClick={() => {
                  if (window.confirm("この費用明細を削除しますか？")) {
                    deleteExpenseRecord(item.id);
                  }
                }}
              >
                削除
              </button>
            </div>
          </article>
        ))}
      </section>

      {open ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/35 px-4 py-8">
          <div className="mx-auto max-w-md rounded-4xl bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{editingId ? "費用を編集" : "費用を追加"}</h3>
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
