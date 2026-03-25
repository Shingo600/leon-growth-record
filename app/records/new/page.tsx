import { PageHeader } from "@/components/page-header";
import { RecordForm } from "@/components/record-form";

export default function NewRecordPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="成長記録入力"
        description="体重を中心に、今日の状態を手早く記録できます。"
      />
      <RecordForm />
    </div>
  );
}
