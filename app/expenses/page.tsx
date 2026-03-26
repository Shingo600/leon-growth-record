import { ExpenseTab } from "@/components/expense-tab";
import { PageHeader } from "@/components/page-header";

export default function ExpensesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="費用"
        description="今月の出費とカテゴリ別の傾向を確認できます。"
      />
      <ExpenseTab />
    </div>
  );
}
