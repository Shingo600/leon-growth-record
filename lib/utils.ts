import {
  ActivityRecord,
  CalendarEvent,
  EventType,
  ExpenseCategory,
  ExpenseRecord,
  FoodItem,
  GraphRange,
  GrowthRecord,
  HealthRecord,
  HealthRecordType,
  MealRecord
} from "@/lib/types";

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(
    "ja-JP",
    options ?? {
      month: "numeric",
      day: "numeric"
    }
  ).format(new Date(date));
}

export function getAgeText(birthday: string) {
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    return `${Math.max(months, 0)}か月`;
  }

  return `${years}歳${months > 0 ? ` ${months}か月` : ""}`;
}

export function formatDateTime(date: string, time?: string) {
  const base = formatDate(date, {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });

  return time ? `${base} ${time}` : base;
}

export function getEventDateTime(event: Pick<CalendarEvent, "date" | "time">) {
  return new Date(`${event.date}T${event.time || "00:00"}:00`);
}

export function getReminderTime(event: Pick<CalendarEvent, "date" | "time" | "reminderMinutes">) {
  return new Date(getEventDateTime(event).getTime() - event.reminderMinutes * 60 * 1000);
}

export function sortRecords(records: GrowthRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}

export function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    const aKey = `${a.date} ${a.time}`;
    const bKey = `${b.date} ${b.time}`;
    return aKey.localeCompare(bKey);
  });
}

export function sortHealthRecords(records: HealthRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}

export function sortActivityRecords(records: ActivityRecord[]) {
  return [...records].sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
}

export function sortMealRecords(records: MealRecord[]) {
  return [...records].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export function sortExpenseRecords(records: ExpenseRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}

export function getTodayDateString() {
  return toDateKey(new Date());
}

export function getUpcomingEvents(events: CalendarEvent[]) {
  const today = getTodayDateString();
  return sortEvents(events).filter((event) => event.date >= today);
}

export function findFoodItem(foodItems: FoodItem[], foodItemId: string) {
  return foodItems.find((item) => item.id === foodItemId);
}

export function sumByCategory(expenseRecords: ExpenseRecord[]) {
  return expenseRecords.reduce<Record<ExpenseCategory, number>>(
    (totals, record) => ({
      ...totals,
      [record.category]: totals[record.category] + record.amount
    }),
    {
      フード: 0,
      病院: 0,
      トリミング: 0,
      消耗品: 0,
      おもちゃ: 0,
      保険: 0,
      その他: 0
    }
  );
}

export function getPendingReminderEvents(
  events: CalendarEvent[],
  now: Date,
  notifiedEventIds: string[]
) {
  return sortEvents(events).filter((event) => {
    if (!event.notify || notifiedEventIds.includes(event.id)) {
      return false;
    }

    const eventTime = getEventDateTime(event);
    const reminderTime = getReminderTime(event);
    const graceEnd = new Date(eventTime.getTime() + 10 * 60 * 1000);

    return now >= reminderTime && now <= graceEnd;
  });
}

export function getGraphData(records: GrowthRecord[], range: GraphRange) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();

  const filtered = sorted.filter((record) => {
    if (range === "全期間") {
      return true;
    }

    const recordDate = new Date(record.date);
    const diffDays = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

    if (range === "1週間") {
      return diffDays <= 7;
    }

    return diffDays <= 31;
  });

  return filtered.map((record) => ({
    date: formatDate(record.date),
    weight: record.taijyuu
  }));
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getEventTypeClassName(type: EventType) {
  switch (type) {
    case "病院":
      return "bg-rose-50 text-rose-700";
    case "薬":
      return "bg-amber-50 text-amber-700";
    case "シャンプー":
      return "bg-sky-50 text-sky-700";
    case "散歩":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function getHealthTypeClassName(type: HealthRecordType) {
  switch (type) {
    case "ワクチン":
      return "bg-rose-50 text-rose-700";
    case "通院":
      return "bg-sky-50 text-sky-700";
    case "投薬":
      return "bg-amber-50 text-amber-700";
    case "検査":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function buildMonthMatrix(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = new Date(firstDay);
  startDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDay);
    date.setDate(startDay.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === month
    };
  });
}
