import { ActivityRecord, DailyGoals } from "@/lib/types";

type SummaryItem = {
  label: string;
  current: number;
  goal: number;
};

function buildStatus(current: number, goal: number) {
  if (current === 0) {
    return "未入力";
  }

  if (current < goal) {
    return "少なめ";
  }

  if (current === goal) {
    return "達成";
  }

  return `+${current - goal}分`;
}

function ProgressRow({ item }: { item: SummaryItem }) {
  const rate = item.goal > 0 ? Math.min((item.current / item.goal) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="text-ink/60">{item.current}分 / 目標{item.goal}分</p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/70">
          {buildStatus(item.current, item.goal)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full bg-warm transition-all" style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

export function ActivitySummaryCard({
  activityRecords,
  goals,
  today
}: {
  activityRecords: ActivityRecord[];
  goals: DailyGoals;
  today: string;
}) {
  const walkMinutes = activityRecords.filter((item) => item.date === today && item.category === "散歩").reduce((sum, item) => sum + item.durationMinutes, 0);
  const intelligenceMinutes = activityRecords.filter((item) => item.date === today && item.category === "知育遊び").reduce((sum, item) => sum + item.durationMinutes, 0);
  const trainingMinutes = activityRecords.filter((item) => item.date === today && item.category === "トレーニング").reduce((sum, item) => sum + item.durationMinutes, 0);

  const items: SummaryItem[] = [
    { label: "散歩時間", current: walkMinutes, goal: goals.walkMinutes },
    { label: "知育遊び", current: intelligenceMinutes, goal: goals.intelligenceMinutes },
    { label: "トレーニング", current: trainingMinutes, goal: goals.trainingMinutes }
  ];

  const totalRate = Math.round(
    items.reduce((sum, item) => sum + Math.min(item.current / item.goal, 1), 0) / items.length * 100
  );

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">今日の活動サマリー</p>
          <h3 className="mt-1 text-xl font-semibold">活動バランス</h3>
        </div>
        <div className="rounded-3xl bg-cream px-4 py-3 text-right">
          <p className="text-xs text-ink/55">全体達成率</p>
          <p className="text-2xl font-semibold">{totalRate}%</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <ProgressRow key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
