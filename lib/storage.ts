import type { AppData, CalendarEvent, DailyGoals, DogProfile, FoodItem, GrowthRecord, MealType } from "@/lib/types";
import { defaultAppData } from "@/lib/dummy-data";
import {
  sortActivityRecords,
  sortCommandPracticeRecords,
  sortDogCommands,
  sortEvents,
  sortExpenseRecords,
  sortHealthRecords,
  sortMealRecords,
  sortRecords
} from "@/lib/utils";

const STORAGE_KEY = "leon-growth-record-data";
const LOCAL_ONLY_KEY = "leon-growth-record-local-only";
const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 16 * 1024 * 1024;

export type SaveAppDataResult =
  | { ok: true }
  | { ok: false; message: string };

export function normalizeAppData(raw: Partial<AppData>): AppData {
  return {
    profile: {
      ...defaultAppData.profile,
      ...raw.profile,
      targetWeight:
        typeof raw.profile?.targetWeight === "number"
          ? raw.profile.targetWeight
          : raw.profile?.currentWeight ?? defaultAppData.profile.targetWeight,
      dailyGoals: {
        ...defaultAppData.profile.dailyGoals,
        ...raw.profile?.dailyGoals
      }
    },
    records: sortRecords(
      (raw.records ?? []).map((record) => ({
        ...record,
        photoUrl: record.photoUrl ?? ""
      }))
    ),
    events: sortEvents(
      (raw.events ?? []).map((event) => ({
        ...event,
        reminderMinutes: typeof event.reminderMinutes === "number" ? event.reminderMinutes : 0
      }))
    ),
    healthRecords: sortHealthRecords(raw.healthRecords ?? []),
    activityRecords: sortActivityRecords(raw.activityRecords ?? []),
    mealRecords: sortMealRecords(raw.mealRecords ?? []),
    foodItems: raw.foodItems ?? defaultAppData.foodItems,
    expenseRecords: sortExpenseRecords(raw.expenseRecords ?? []),
    dogCommands: sortDogCommands(raw.dogCommands ?? defaultAppData.dogCommands),
    commandPracticeRecords: sortCommandPracticeRecords(raw.commandPracticeRecords ?? [])
  };
}

function isEmbeddedImage(value: string) {
  return value.startsWith("data:image/");
}

export function stripEmbeddedImagesForCloud(data: AppData): AppData {
  return {
    ...data,
    profile: {
      ...data.profile,
      photoUrl: isEmbeddedImage(data.profile.photoUrl) ? "" : data.profile.photoUrl
    },
    records: data.records.map((record) => ({
      ...record,
      photoUrl: isEmbeddedImage(record.photoUrl) ? "" : record.photoUrl
    }))
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Rule = (value: unknown) => boolean;
type Fields<T> = { [Key in keyof T]-?: Rule };
const text: Rule = (value) => typeof value === "string";
const number: Rule = (value) => typeof value === "number" && Number.isFinite(value);
const boolean: Rule = (value) => typeof value === "boolean";
const optional = (rule: Rule): Rule => (value) => value === undefined || rule(value);
const nullable = (rule: Rule): Rule => (value) => value === null || rule(value);
const choice = (...values: string[]): Rule => (value) => typeof value === "string" && values.includes(value);
const date: Rule = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const optionalDate: Rule = (value) => value === "" || date(value);
const time: Rule = (value) => typeof value === "string" && (value === "" || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value));
const timestamp: Rule = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const fields = (rules: Record<string, Rule>, partial = false): Rule => (value) =>
  isObject(value) && Object.keys(value).every((key) => Object.hasOwn(rules, key)) &&
  Object.entries(rules).every(([key, rule]) => partial && !Object.hasOwn(value, key) || rule(value[key]));
const rows = <T>(rules: Fields<T>): Rule => {
  const row = fields(rules);
  return optional((value) => Array.isArray(value) && value.every(row));
};

const goals: Fields<DailyGoals> = { walkMinutes: number, intelligenceMinutes: number, trainingMinutes: number };
const profile: Fields<DogProfile> = {
  name: text, breed: text, birthday: optionalDate, gender: choice("オス", "メス", "不明"),
  arrivalDate: optionalDate, currentWeight: number, targetWeight: number, photoUrl: text,
  dailyGoals: fields(goals, true), catchPhrase: text
};
const growth: Fields<GrowthRecord> = {
  id: text, date, taijyuu: number, appetite: choice("良い", "普通", "悪い"),
  energyLevel: choice("元気", "普通", "元気なし"), poopCondition: choice("良い", "柔らかい", "下痢"),
  memo: text, photoUrl: optional(nullable(text)), createdAt: timestamp
};
const event: Fields<CalendarEvent> = {
  id: text, title: text, date, time, type: choice("散歩", "病院", "薬", "シャンプー", "その他"),
  notify: boolean, reminderMinutes: optional(number), memo: text, createdAt: timestamp
};
const mealTypes: Fields<Record<MealType, number>> = { 朝: number, 昼: number, 夜: number, おやつ: number };
const food: Fields<FoodItem> = {
  id: text, productName: text, maker: text, category: choice("ドライ", "ウェット", "おやつ", "サプリ"),
  caloriesPer100g: number, servingSize: number, mealRecommendations: optional(fields(mealTypes, true)),
  memo: text, openedDate: optionalDate, price: nullable(number), contentAmount: nullable(number)
};
const appDataRules: Fields<AppData> = {
  profile: fields(profile, true), records: rows(growth), events: rows(event),
  healthRecords: rows<AppData["healthRecords"][number]>({
    id: text, date, type: choice("ワクチン", "通院", "投薬", "検査", "その他"), title: text,
    hospital: text, doctorNote: text, nextDueDate: optionalDate, memo: text, createdAt: timestamp
  }),
  activityRecords: rows<AppData["activityRecords"][number]>({
    id: text, date, startTime: time, durationMinutes: number, category: choice("散歩", "知育遊び", "トレーニング"),
    kind: choice("散歩", "散歩（匂い嗅ぎ中心）", "ボール遊び", "引っ張りっこ", "ノーズワーク", "知育トイ", "コマンド練習", "社会化"),
    memo: text, createdAt: timestamp
  }),
  mealRecords: rows<AppData["mealRecords"][number]>({
    id: text, date, time, mealType: choice(...Object.keys(mealTypes)), foodItemId: text,
    grams: number, leftoverRate: number, memo: text, createdAt: timestamp
  }),
  foodItems: rows(food),
  expenseRecords: rows<AppData["expenseRecords"][number]>({
    id: text, date, category: choice("フード", "病院", "トリミング", "消耗品", "おもちゃ", "保険", "その他"),
    itemName: text, amount: number, payee: text, memo: text, createdAt: timestamp
  }),
  dogCommands: rows<AppData["dogCommands"][number]>({
    id: text, name: text, status: choice("練習中", "ほぼOK", "習得"), cueType: choice("声", "手", "両方"),
    successRate: number, lastPracticedDate: optionalDate, memo: text, createdAt: timestamp
  }),
  commandPracticeRecords: rows<AppData["commandPracticeRecords"][number]>({
    id: text, date, commandId: text, durationMinutes: number, attempts: number, successes: number,
    focusLevel: choice("高い", "普通", "低い"), memo: text, createdAt: timestamp
  })
};
const isAppDataInput = fields(appDataRules);

export function parseAppData(value: unknown, requireCoreCollections = false): AppData | null {
  if (!isObject(value) || !isAppDataInput(value)) return null;
  if (requireCoreCollections && ![value.records, value.events, value.healthRecords].every(Array.isArray)) return null;
  return normalizeAppData(value as Partial<AppData>);
}

export function createBackupData(data: AppData) {
  return {
    appName: "レオン成長記録",
    exportedAt: new Date().toISOString(),
    schemaVersion: BACKUP_SCHEMA_VERSION,
    data
  };
}

export function parseBackupData(rawText: string): { ok: true; data: AppData } | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(rawText) as unknown;

    if (!isObject(parsed) || ("schemaVersion" in parsed && parsed.schemaVersion !== BACKUP_SCHEMA_VERSION)) {
      return { ok: false, message: "バックアップファイルの形式が正しくありません。" };
    }

    const candidate = "data" in parsed ? parsed.data : parsed;
    const data = parseAppData(candidate);
    return data ? { ok: true, data } : { ok: false, message: "バックアップの項目または値が不正です。データは変更していません。" };
  } catch {
    return { ok: false, message: "JSONの読み込みに失敗しました。バックアップファイルを確認してください。" };
  }
}

export function hasLocalOnlyData() {
  try {
    return window.localStorage.getItem(LOCAL_ONLY_KEY) === "1";
  } catch {
    return true;
  }
}

export function keepDataLocal() {
  try {
    window.localStorage.setItem(LOCAL_ONLY_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function clearLocalOnlyData() {
  try {
    window.localStorage.removeItem(LOCAL_ONLY_KEY);
  } catch {
    // Retaining the local-only marker is safer than seeding cloud from local data.
  }
}

export function loadAppData(): AppData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeAppData(JSON.parse(raw) as AppData);
  } catch (error) {
    console.error("localStorageの読込に失敗しました", error);
    return null;
  }
}

export function saveAppData(data: AppData): SaveAppDataResult {
  if (typeof window === "undefined") {
    return { ok: true };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (error) {
    console.error("localStorageの保存に失敗しました", error);
    return {
      ok: false,
      message: "保存に失敗しました。画像サイズが大きすぎる可能性があります。2MB以下の画像で再度お試しください。"
    };
  }
}
