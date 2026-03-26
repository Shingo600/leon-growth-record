"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "@/components/app-provider";
import { ExpenseCategory } from "@/lib/types";
import { sumByCategory } from "@/lib/utils";

const categories: ExpenseCategory[] = ["フード", "病院", "トリミング", "消耗品", "おもちゃ", "保険", "その他"];

export function ExpenseTab() {
  const { data, addExpenseRecord } = useAppData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "フード" as ExpenseCategory,
    itemName: "",
    amount: "1000",
    payee: "",
    memo: ""
  });

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
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, amount]) => ({ month, amount }));
  }, [data.expenseRecords]);

  return (
    <div className="space-y-5">
      <section className="card space-y-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink/60">今月の合計費用</p>
            <h2 className="mt-1 text-3xl font-semibold">¥{monthTotal.toLocaleString()}</h2>
          </div>
          <button type="button" className="button-primary" onClick={() => setOpen(true)}>費用を追加</button>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-lg font-semibold">月別の費用推移</h3>
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthChartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
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
          </article>
        ))}
      </section>

      {open ? (
        <div className="fixed inset-0 z-30 bg-ink/35 px-4 py-8">
          <div className="mx-auto max-w-md rounded-4xl bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">費用を記録</h3>
              <button type="button" className="button-secondary px-4 py-2" onClick={() => setOpen(false)}>閉じる</button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                addExpenseRecord({
                  date: form.date,
                  category: form.category,
                  itemName: form.itemName,
                  amount: Number(form.amount),
                  payee: form.payee,
                  memo: form.memo
                });
                setOpen(false);
              }}
            >
              <input className="input date-input" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
              <select className="input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input className="input" type="text" placeholder="品名" value={form.itemName} onChange={(event) => setForm((current) => ({ ...current, itemName: event.target.value }))} required />
              <input className="input" type="number" min="0" placeholder="金額" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
              <input className="input" type="text" placeholder="支払先" value={form.payee} onChange={(event) => setForm((current) => ({ ...current, payee: event.target.value }))} />
              <textarea className="input min-h-24 resize-none" placeholder="メモ" value={form.memo} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} />
              <button className="button-primary w-full" type="submit">保存する</button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
