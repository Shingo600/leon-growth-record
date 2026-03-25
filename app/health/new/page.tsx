import { HealthForm } from "@/components/health-form";
import { PageHeader } from "@/components/page-header";

export default function NewHealthPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="健康履歴を追加"
        description="ワクチン、通院、投薬などをあとで見返しやすく保存します。"
      />
      <HealthForm />
    </div>
  );
}
