import { ExpenseRecord } from "@/lib/types";
import { sumByCategory } from "@/lib/utils";

export function ExpenseSummaryCard({
  expenseRecords,
  title = "今月の費用サマリー"
}: {
  expenseRecords: ExpenseRecord[];
  title?: string;
}) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
  const monthlyRecords = expenseRecords.filter((item) => item.date.startsWith(monthKey));
  const total = monthlyRecords.reduce((sum, item) => sum + item.amount, 0);
  const totals = sumByCategory(monthlyRecords);
  const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">{title}</p>
          <h3 className="mt-1 text-xl font-semibold">ペット費用</h3>
        </div>
        <div className="rounded-3xl bg-cream px-4 py-3 text-right">
          <p className="text-xs text-ink/55">今月合計</p>
          <p className="text-2xl font-semibold">¥{total.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-sm text-ink/70">
        {topCategory && topCategory[1] > 0 ? `今月いちばん多いのは ${topCategory[0]} です。` : "まだ費用記録がありません。"}
      </p>
    </section>
  );
}
