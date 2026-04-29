"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentActivityMinutes } from "@/lib/activity";
import { defaultAppData } from "@/lib/dummy-data";
import { loadAppData, saveAppData } from "@/lib/storage";
import { connectCloudSync, disconnectCloudSync, fetchCloudAppData, saveCloudAppData } from "@/lib/supabase";
import {
  ActivityCategory,
  ActivityKind,
  ActivityRecord,
  AppData,
  CalendarEvent,
  DogProfile,
  ExpenseRecord,
  FoodItem,
  GrowthRecord,
  HealthRecord,
  MealRecord
} from "@/lib/types";
import {
  createId,
  sortActivityRecords,
  sortEvents,
  sortExpenseRecords,
  sortHealthRecords,
  sortMealRecords,
  sortRecords
} from "@/lib/utils";

type RecordInput = Omit<GrowthRecord, "id" | "createdAt">;
type EventInput = Omit<CalendarEvent, "id" | "createdAt">;
type HealthRecordInput = Omit<HealthRecord, "id" | "createdAt">;
type ActivityRecordInput = Omit<ActivityRecord, "id" | "createdAt">;
type MealRecordInput = Omit<MealRecord, "id" | "createdAt">;
type ExpenseRecordInput = Omit<ExpenseRecord, "id" | "createdAt">;
type FoodItemInput = Omit<FoodItem, "id">;
type StorageMode = "local" | "cloud";
type SyncStatus = "idle" | "syncing" | "synced" | "error";

type AppContextValue = {
  data: AppData;
  isReady: boolean;
  saveError: string;
  storageMode: StorageMode;
  syncStatus: SyncStatus;
  syncMessage: string;
  syncAuthRequired: boolean;
  connectSync: (passcode: string) => Promise<boolean>;
  disconnectSync: () => Promise<void>;
  replaceData: (data: AppData) => void;
  updateProfile: (profile: DogProfile) => void;
  addRecord: (record: RecordInput) => void;
  updateRecord: (id: string, record: RecordInput) => void;
  deleteRecord: (id: string) => void;
  addEvent: (event: EventInput) => void;
  updateEvent: (id: string, event: EventInput) => void;
  deleteEvent: (id: string) => void;
  addHealthRecord: (record: HealthRecordInput) => void;
  updateHealthRecord: (id: string, record: HealthRecordInput) => void;
  deleteHealthRecord: (id: string) => void;
  addActivityRecord: (record: ActivityRecordInput) => void;
  incrementActivity: (date: string, category: ActivityCategory, kind: ActivityKind, minutes: number) => void;
  decrementActivity: (date: string, category: ActivityCategory, kind: ActivityKind, minutes: number) => void;
  setActivityMinutes: (date: string, category: ActivityCategory, kind: ActivityKind, minutes: number) => void;
  completeActivity: (date: string, category: ActivityCategory, kind: ActivityKind, goalMinutes: number) => void;
  resetActivity: (date: string, category: ActivityCategory, kind: ActivityKind) => void;
  addMealRecord: (record: MealRecordInput) => void;
  updateMealRecord: (id: string, record: MealRecordInput) => void;
  deleteMealRecord: (id: string) => void;
  addExpenseRecord: (record: ExpenseRecordInput) => void;
  updateExpenseRecord: (id: string, record: ExpenseRecordInput) => void;
  deleteExpenseRecord: (id: string) => void;
  addFoodItem: (item: FoodItemInput) => void;
  updateFoodItem: (id: string, item: FoodItemInput) => void;
  deleteFoodItem: (id: string) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getInitialData(): AppData {
  return {
    ...defaultAppData,
    records: sortRecords(defaultAppData.records),
    events: sortEvents(defaultAppData.events),
    healthRecords: sortHealthRecords(defaultAppData.healthRecords),
    activityRecords: sortActivityRecords(defaultAppData.activityRecords),
    mealRecords: sortMealRecords(defaultAppData.mealRecords),
    foodItems: defaultAppData.foodItems,
    expenseRecords: sortExpenseRecords(defaultAppData.expenseRecords)
  };
}

function getProfileWeight(records: GrowthRecord[], currentWeight: number) {
  return records[0]?.taijyuu ?? currentWeight;
}

function getNowTime() {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

function buildActivityAdjustment(
  date: string,
  category: ActivityCategory,
  kind: ActivityKind,
  minutes: number
): ActivityRecord {
  return {
    id: createId("activity"),
    date,
    startTime: getNowTime(),
    durationMinutes: minutes,
    category,
    kind,
    memo: "",
    createdAt: new Date().toISOString()
  };
}

function hasMeaningfulData(appData: AppData) {
  return Boolean(
    appData.records.length ||
      appData.events.length ||
      appData.healthRecords.length ||
      appData.activityRecords.length ||
      appData.mealRecords.length ||
      appData.foodItems.length ||
      appData.expenseRecords.length ||
      appData.profile.breed ||
      appData.profile.birthday ||
      appData.profile.arrivalDate ||
      appData.profile.photoUrl
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(getInitialData);
  const [isReady, setIsReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [storageMode, setStorageMode] = useState<StorageMode>("local");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState("この端末に保存しています。");
  const [syncAuthRequired, setSyncAuthRequired] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const localData = loadAppData();

      if (localData && !cancelled) {
        setData(localData);
      }

      setSyncStatus("syncing");
      setSyncMessage("クラウド同期を確認しています。");

      const result = await fetchCloudAppData();
      if (cancelled) {
        return;
      }

      if (result.ok && result.data) {
        const nextData =
          localData && hasMeaningfulData(localData) && !hasMeaningfulData(result.data) ? localData : result.data;
        setData(nextData);
        setStorageMode("cloud");
        setSyncStatus("synced");
        setSyncAuthRequired(false);
        setSyncMessage("クラウド同期を使っています。家族の端末でも同じデータを見られます。");
      } else if (result.ok && !result.data) {
        setStorageMode("cloud");
        setSyncStatus("idle");
        setSyncAuthRequired(false);
        setSyncMessage("クラウド同期は有効です。まだクラウド側に保存はありません。");
      } else if (!result.ok && result.code === "auth-required") {
        setStorageMode("local");
        setSyncStatus("error");
        setSyncAuthRequired(true);
        setSyncMessage("家族共有を使うには同期コードを入力してください。");
        setSaveError("");
      } else if (!result.ok && result.code === "not-configured") {
        setStorageMode("local");
        setSyncStatus("idle");
        setSyncAuthRequired(false);
        setSyncMessage("この端末に保存しています。クラウド同期はまだ設定されていません。");
      } else {
        const errorMessage = result.ok ? "" : result.message;
        setStorageMode("local");
        setSyncStatus("error");
        setSyncAuthRequired(false);
        setSyncMessage(`クラウド同期に失敗したため、この端末の保存に切り替えています。詳細: ${errorMessage}`);
        setSaveError(errorMessage);
      }

      if (!cancelled) {
        hasLoadedRef.current = true;
        setIsReady(true);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !hasLoadedRef.current) {
      return;
    }

    const localResult = saveAppData(data);
    if (storageMode === "local") {
      setSaveError(localResult.ok ? "" : localResult.message);
    } else if (localResult.ok) {
      setSaveError("");
    }

    if (storageMode !== "cloud") {
      return;
    }

    let cancelled = false;

    async function syncCloud() {
      setSyncStatus("syncing");
      const result = await saveCloudAppData(data);
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setSyncStatus("synced");
        setSaveError("");
        setSyncMessage("クラウド同期済みです。");
        return;
      }

      setSyncStatus("error");
      setSyncAuthRequired(result.code === "auth-required");
      setSyncMessage(
        result.code === "auth-required"
          ? "同期コードの確認が必要です。プロフィールで再接続してください。"
          : "クラウド保存に失敗したため、この端末の保存を続けています。"
      );
      setSaveError(result.message);
    }

    void syncCloud();

    return () => {
      cancelled = true;
    };
  }, [data, isReady, storageMode]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      isReady,
      saveError,
      storageMode,
      syncStatus,
      syncMessage,
      syncAuthRequired,
      async connectSync(passcode) {
        const authResult = await connectCloudSync(passcode);
        if (!authResult.ok) {
          setStorageMode("local");
          setSyncStatus("error");
          setSyncAuthRequired(authResult.code !== "not-configured");
          setSyncMessage(
            authResult.code === "not-configured"
              ? "クラウド同期はまだ設定されていません。"
              : "同期コードを確認してからもう一度お試しください。"
          );
          setSaveError(authResult.message);
          return false;
        }

        const cloudResult = await fetchCloudAppData();
        if (!cloudResult.ok) {
          setStorageMode("local");
          setSyncStatus("error");
          setSyncAuthRequired(cloudResult.code === "auth-required");
          setSyncMessage(`同期コードは通りましたが、クラウドの読み込みに失敗しました。詳細: ${cloudResult.message}`);
          setSaveError(cloudResult.message);
          return false;
        }

        if (cloudResult.data) {
          setData((current) => (hasMeaningfulData(current) && !hasMeaningfulData(cloudResult.data!) ? current : cloudResult.data!));
        }

        setStorageMode("cloud");
        setSyncStatus(cloudResult.data ? "synced" : "idle");
        setSyncAuthRequired(false);
        setSyncMessage(
          cloudResult.data
            ? "クラウド同期を使っています。家族の端末でも同じデータを見られます。"
            : "クラウド同期は有効です。まだクラウド側に保存はありません。"
        );
        setSaveError("");
        return true;
      },
      async disconnectSync() {
        await disconnectCloudSync();
        setStorageMode("local");
        setSyncStatus("idle");
        setSyncAuthRequired(true);
        setSyncMessage("この端末の保存に戻しました。再接続するには同期コードを入力してください。");
      },
      replaceData(nextData) {
        setData(nextData);
      },
      updateProfile(profile) {
        setData((current) => ({
          ...current,
          profile
        }));
      },
      addRecord(record) {
        setData((current) => {
          const nextRecords = sortRecords([
            {
              ...record,
              id: createId("record"),
              createdAt: new Date().toISOString()
            },
            ...current.records
          ]);

          return {
            ...current,
            profile: {
              ...current.profile,
              currentWeight: getProfileWeight(nextRecords, current.profile.currentWeight)
            },
            records: nextRecords
          };
        });
      },
      updateRecord(id, record) {
        setData((current) => {
          const nextRecords = sortRecords(
            current.records.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...record
                  }
                : item
            )
          );

          return {
            ...current,
            profile: {
              ...current.profile,
              currentWeight: getProfileWeight(nextRecords, current.profile.currentWeight)
            },
            records: nextRecords
          };
        });
      },
      deleteRecord(id) {
        setData((current) => {
          const nextRecords = sortRecords(current.records.filter((item) => item.id !== id));

          return {
            ...current,
            profile: {
              ...current.profile,
              currentWeight: getProfileWeight(nextRecords, current.profile.currentWeight)
            },
            records: nextRecords
          };
        });
      },
      addEvent(event) {
        setData((current) => ({
          ...current,
          events: sortEvents([
            ...current.events,
            {
              ...event,
              id: createId("event"),
              createdAt: new Date().toISOString()
            }
          ])
        }));
      },
      updateEvent(id, event) {
        setData((current) => ({
          ...current,
          events: sortEvents(
            current.events.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...event
                  }
                : item
            )
          )
        }));
      },
      deleteEvent(id) {
        setData((current) => ({
          ...current,
          events: sortEvents(current.events.filter((item) => item.id !== id))
        }));
      },
      addHealthRecord(record) {
        setData((current) => ({
          ...current,
          healthRecords: sortHealthRecords([
            {
              ...record,
              id: createId("health"),
              createdAt: new Date().toISOString()
            },
            ...current.healthRecords
          ])
        }));
      },
      updateHealthRecord(id, record) {
        setData((current) => ({
          ...current,
          healthRecords: sortHealthRecords(
            current.healthRecords.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...record
                  }
                : item
            )
          )
        }));
      },
      deleteHealthRecord(id) {
        setData((current) => ({
          ...current,
          healthRecords: sortHealthRecords(current.healthRecords.filter((item) => item.id !== id))
        }));
      },
      addActivityRecord(record) {
        setData((current) => ({
          ...current,
          activityRecords: sortActivityRecords([
            {
              ...record,
              id: createId("activity"),
              createdAt: new Date().toISOString()
            },
            ...current.activityRecords
          ])
        }));
      },
      incrementActivity(date, category, kind, minutes) {
        if (minutes <= 0) {
          return;
        }

        setData((current) => ({
          ...current,
          activityRecords: sortActivityRecords([
            buildActivityAdjustment(date, category, kind, minutes),
            ...current.activityRecords
          ])
        }));
      },
      decrementActivity(date, category, kind, minutes) {
        if (minutes <= 0) {
          return;
        }

        setData((current) => {
          const currentMinutes = getCurrentActivityMinutes(current.activityRecords, date, category);
          const nextMinutes = Math.max(currentMinutes - minutes, 0);
          const diff = nextMinutes - currentMinutes;

          if (diff === 0) {
            return current;
          }

          return {
            ...current,
            activityRecords: sortActivityRecords([
              buildActivityAdjustment(date, category, kind, diff),
              ...current.activityRecords
            ])
          };
        });
      },
      setActivityMinutes(date, category, kind, minutes) {
        const safeMinutes = Math.max(minutes, 0);

        setData((current) => {
          const currentMinutes = getCurrentActivityMinutes(current.activityRecords, date, category);
          const diff = safeMinutes - currentMinutes;

          if (diff === 0) {
            return current;
          }

          return {
            ...current,
            activityRecords: sortActivityRecords([
              buildActivityAdjustment(date, category, kind, diff),
              ...current.activityRecords
            ])
          };
        });
      },
      completeActivity(date, category, kind, goalMinutes) {
        const safeGoal = Math.max(goalMinutes, 0);
        setData((current) => {
          const currentMinutes = getCurrentActivityMinutes(current.activityRecords, date, category);
          const diff = safeGoal - currentMinutes;

          if (diff === 0) {
            return current;
          }

          return {
            ...current,
            activityRecords: sortActivityRecords([
              buildActivityAdjustment(date, category, kind, diff),
              ...current.activityRecords
            ])
          };
        });
      },
      resetActivity(date, category, kind) {
        setData((current) => {
          const currentMinutes = getCurrentActivityMinutes(current.activityRecords, date, category);
          if (currentMinutes === 0) {
            return current;
          }

          return {
            ...current,
            activityRecords: sortActivityRecords([
              buildActivityAdjustment(date, category, kind, -currentMinutes),
              ...current.activityRecords
            ])
          };
        });
      },
      addMealRecord(record) {
        setData((current) => ({
          ...current,
          mealRecords: sortMealRecords([
            {
              ...record,
              id: createId("meal"),
              createdAt: new Date().toISOString()
            },
            ...current.mealRecords
          ])
        }));
      },
      updateMealRecord(id, record) {
        setData((current) => ({
          ...current,
          mealRecords: sortMealRecords(
            current.mealRecords.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...record
                  }
                : item
            )
          )
        }));
      },
      deleteMealRecord(id) {
        setData((current) => ({
          ...current,
          mealRecords: sortMealRecords(current.mealRecords.filter((item) => item.id !== id))
        }));
      },
      addExpenseRecord(record) {
        setData((current) => ({
          ...current,
          expenseRecords: sortExpenseRecords([
            {
              ...record,
              id: createId("expense"),
              createdAt: new Date().toISOString()
            },
            ...current.expenseRecords
          ])
        }));
      },
      updateExpenseRecord(id, record) {
        setData((current) => ({
          ...current,
          expenseRecords: sortExpenseRecords(
            current.expenseRecords.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...record
                  }
                : item
            )
          )
        }));
      },
      deleteExpenseRecord(id) {
        setData((current) => ({
          ...current,
          expenseRecords: sortExpenseRecords(current.expenseRecords.filter((item) => item.id !== id))
        }));
      },
      addFoodItem(item) {
        setData((current) => ({
          ...current,
          foodItems: [
            {
              ...item,
              id: createId("food")
            },
            ...current.foodItems
          ]
        }));
      },
      updateFoodItem(id, item) {
        setData((current) => ({
          ...current,
          foodItems: current.foodItems.map((food) =>
            food.id === id
              ? {
                  ...food,
                  ...item
                }
              : food
          )
        }));
      },
      deleteFoodItem(id) {
        setData((current) => ({
          ...current,
          foodItems: current.foodItems.filter((food) => food.id !== id),
          mealRecords: sortMealRecords(current.mealRecords.filter((meal) => meal.foodItemId !== id))
        }));
      }
    }),
    [data, isReady, saveError, storageMode, syncAuthRequired, syncMessage, syncStatus]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData は AppProvider の中で使ってください");
  }

  return context;
}
