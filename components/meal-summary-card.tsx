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

      <div className="space-y-3">
        {mealTypes.map((mealType) => {
          const records = todayMeals.filter((item) => item.mealType === mealType);
          const first = records[0];
          const food = first ? findFoodItem(foodItems, first.foodItemId) : null;

          return (
            <div key={mealType} className="rounded-3xl bg-cream px-4 py-3">
              <p className="text-sm font-semibold">{mealType}</p>
              {first && food ? (
                <p className="mt-1 text-sm text-ink/70">
                  {first.time} {food.productName} {first.grams}g
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink/50">まだ記録がありません</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
