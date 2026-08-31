import { CommandTrainingManager } from "@/components/command-training-manager";
import { PageHeader } from "@/components/page-header";

export default function CommandsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="コマンド特訓"
        description="覚えたコマンドと毎日の練習をまとめて確認できます。短い練習でも残していきましょう。"
      />
      <CommandTrainingManager />
    </div>
  );
}
