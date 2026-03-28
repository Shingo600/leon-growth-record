import { FoodItem, MealRecord, MealType } from "@/lib/types";
import { findFoodItem } from "@/lib/utils";

const mealTypes: MealType[] = ["朝", "昼", "夜", "おやつ"];

export function MealSummaryCard({
  mealRecords,
  foodItems,
  today
}: {
  mealRecords: MealRecord[];
  foodItems: FoodItem[];
  today: string;
}) {
  const todayMeals = mealRecords.filter((item) => item.date === today);
  const totalGrams = todayMeals.reduce((sum, item) => sum + item.grams * (1 - item.leftoverRate / 100), 0);

  const sections = mealTypes
    .map((mealType) => ({
      mealType,
      records: todayMeals.filter((item) => item.mealType === mealType)
    }))
    .filter((section) => section.records.length > 0);

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">今日のごはんサマリー</p>
          <h3 className="mt-1 text-xl font-semibold">食事の記録</h3>
        </div>
        <div className="rounded-3xl bg-cream px-4 py-3 text-right">
          <p className="text-xs text-ink/55">今日合計</p>
          <p className="text-2xl font-semibold">{Math.round(totalGrams)}g</p>
        </div>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map(({ mealType, records }) => (
            <div key={mealType} className="rounded-3xl bg-cream px-4 py-3">
              <p className="text-sm font-semibold">{mealType}</p>
              <div className="mt-2 space-y-2">
                {records.map((record) => {
                  const food = findFoodItem(foodItems, record.foodItemId);
                  const detailParts = [
                    record.time,
                    food?.productName ?? "フード未登録",
                    `${record.grams}g`
                  ];

                  if (record.leftoverRate > 0) {
                    detailParts.push(`食べ残し ${record.leftoverRate}%`);
                  }

                  return (
                    <div key={record.id} className="rounded-2xl bg-white/70 px-3 py-2 text-sm leading-6 text-ink/75">
                      <p className="break-words">{detailParts.join(" ")}</p>
                      {record.memo ? <p className="mt-1 break-words text-ink/60">{record.memo}</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-cream px-4 py-4 text-sm leading-6 text-ink/55">
          今日はまだ食事の記録がありません。
        </div>
      )}
    </section>
  );
}
