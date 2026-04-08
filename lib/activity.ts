import type { ActivityCategory, ActivityKind, ActivityRecord, DailyGoals } from "@/lib/types";

export type ActivityItem = {
  key: "walk" | "intelligence" | "training";
  label: string;
  category: ActivityCategory;
  quickKind: ActivityKind;
  current: number;
  goal: number;
  remaining: number;
  progress: number;
  status: "未入力" | "進行中" | "達成";
};

type ActivityConfig = {
  key: ActivityItem["key"];
  label: string;
  category: ActivityCategory;
  quickKind: ActivityKind;
  goalKey: keyof DailyGoals;
};

const activityConfigs: ActivityConfig[] = [
  { key: "walk", label: "散歩", category: "散歩", quickKind: "散歩", goalKey: "walkMinutes" },
  {
    key: "intelligence",
    label: "知育遊び",
    category: "知育遊び",
    quickKind: "ノーズワーク",
    goalKey: "intelligenceMinutes"
  },
  {
    key: "training",
    label: "トレーニング",
    category: "トレーニング",
    quickKind: "コマンド練習",
    goalKey: "trainingMinutes"
  }
];

export function getActivityStatus(current: number, goal: number): ActivityItem["status"] {
  if (current <= 0) {
    return "未入力";
  }

  if (current >= goal) {
    return "達成";
  }

  return "進行中";
}

export function getCurrentActivityMinutes(records: ActivityRecord[], date: string, category: ActivityCategory) {
  const total = records
    .filter((item) => item.date === date && item.category === category)
    .reduce((sum, item) => sum + item.durationMinutes, 0);

  return Math.max(total, 0);
}

export function buildActivityItems(activityRecords: ActivityRecord[], goals: DailyGoals, today: string): ActivityItem[] {
  return activityConfigs.map((config) => {
    const current = getCurrentActivityMinutes(activityRecords, today, config.category);
    const goal = goals[config.goalKey];
    const remaining = Math.max(goal - current, 0);
    const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

    return {
      key: config.key,
      label: config.label,
      category: config.category,
      quickKind: config.quickKind,
      current,
      goal,
      remaining,
      progress,
      status: getActivityStatus(current, goal)
    };
  });
}

export function getActivityCompletionRate(items: ActivityItem[]) {
  if (items.length === 0) {
    return 0;
  }

  return Math.round((items.reduce((sum, item) => sum + Math.min(item.current / item.goal, 1), 0) / items.length) * 100);
}

export function getPendingActivityItems(items: ActivityItem[]) {
  return items.filter((item) => item.current < item.goal);
}

export function getActivitySummaryMessage(items: ActivityItem[]) {
  const pendingItems = getPendingActivityItems(items);

  if (pendingItems.length === 0) {
    return "今日はぜんぶ達成！レオンえらい！";
  }

  if (pendingItems.length === 1) {
    return `${pendingItems[0].label}をあと${pendingItems[0].remaining}分で達成です。`;
  }

  if (pendingItems.length === 2) {
    return `${pendingItems[0].label}と${pendingItems[1].label}を進めると、今日のバランスが整います。`;
  }

  return "今日はこれからスタート。まずは少しだけ記録してみましょう。";
}
