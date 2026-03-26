import { FoodItem } from "@/lib/types";

type FoodDatabaseSelectorProps = {
  foodItems: FoodItem[];
  value: string;
  onChange: (value: string) => void;
};

export function FoodDatabaseSelector({ foodItems, value, onChange }: FoodDatabaseSelectorProps) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">ごはんを選択</option>
      {foodItems.map((item) => (
        <option key={item.id} value={item.id}>
          {item.productName} / {item.maker} / {item.category}
        </option>
      ))}
    </select>
  );
}
