import { AppData } from "@/lib/types";
import { defaultAppData } from "@/lib/dummy-data";
import { sortEvents, sortHealthRecords, sortRecords } from "@/lib/utils";

const STORAGE_KEY = "leon-growth-record-data";
const BACKUP_SCHEMA_VERSION = 1;

export type SaveAppDataResult =
  | { ok: true }
  | { ok: false; message: string };

export function normalizeAppData(raw: Partial<AppData>): AppData {
  return {
    profile: {
      ...defaultAppData.profile,
      ...raw.profile
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
    healthRecords: sortHealthRecords(raw.healthRecords ?? [])
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

    if (!isObject(parsed)) {
      return { ok: false, message: "バックアップファイルの形式が正しくありません。" };
    }

    const candidate = "data" in parsed ? parsed.data : parsed;
    if (!isObject(candidate) || !("profile" in candidate)) {
      return { ok: false, message: "バックアップデータに必要な項目がありません。" };
    }

    return {
      ok: true,
      data: normalizeAppData(candidate as Partial<AppData>)
    };
  } catch {
    return { ok: false, message: "JSONの読み込みに失敗しました。バックアップファイルを確認してください。" };
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
