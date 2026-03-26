"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultAppData } from "@/lib/dummy-data";
import { loadAppData, saveAppData } from "@/lib/storage";
import {
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

type AppContextValue = {
  data: AppData;
  isReady: boolean;
  saveError: string;
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
  addMealRecord: (record: MealRecordInput) => void;
  addExpenseRecord: (record: ExpenseRecordInput) => void;
  addFoodItem: (item: FoodItemInput) => void;
  updateFoodItem: (id: string, item: FoodItemInput) => void;
  deleteFoodItem: (id: string) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getProfileWeight(records: GrowthRecord[], currentWeight: number) {
  return records[0]?.taijyuu ?? currentWeight;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => ({
    ...defaultAppData,
    records: sortRecords(defaultAppData.records),
    events: sortEvents(defaultAppData.events),
    healthRecords: sortHealthRecords(defaultAppData.healthRecords),
    activityRecords: sortActivityRecords(defaultAppData.activityRecords),
    mealRecords: sortMealRecords(defaultAppData.mealRecords),
    foodItems: defaultAppData.foodItems,
    expenseRecords: sortExpenseRecords(defaultAppData.expenseRecords)
  }));
  const [isReady, setIsReady] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const saved = loadAppData();
    if (saved) {
      setData(saved);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const result = saveAppData(data);
    setSaveError(result.ok ? "" : result.message);
  }, [data, isReady]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      isReady,
      saveError,
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
    [data, isReady, saveError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData は AppProvider の中で使用してください");
  }

  return context;
}
