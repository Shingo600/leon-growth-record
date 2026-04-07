export type DogGender = "オス" | "メス" | "不明";
export type Appetite = "良い" | "普通" | "悪い";
export type EnergyLevel = "元気" | "普通" | "元気なし";
export type PoopCondition = "良い" | "柔らかい" | "下痢";
export type EventType = "散歩" | "病院" | "薬" | "シャンプー" | "その他";
export type HealthRecordType = "ワクチン" | "通院" | "投薬" | "検査" | "その他";
export type ActivityCategory = "散歩" | "知育遊び" | "トレーニング";
export type ActivityKind =
  | "散歩"
  | "散歩（匂い嗅ぎ中心）"
  | "ボール遊び"
  | "引っ張りっこ"
  | "ノーズワーク"
  | "知育トイ"
  | "コマンド練習"
  | "社会化";
export type MealType = "朝" | "昼" | "夜" | "おやつ";
export type FoodCategory = "ドライ" | "ウェット" | "おやつ" | "サプリ";
export type ExpenseCategory = "フード" | "病院" | "トリミング" | "消耗品" | "おもちゃ" | "保険" | "その他";
export type GraphRange = "1週間" | "1か月" | "全期間";

export type DailyGoals = {
  walkMinutes: number;
  intelligenceMinutes: number;
  trainingMinutes: number;
};

export type DogProfile = {
  name: string;
  breed: string;
  birthday: string;
  gender: DogGender;
  arrivalDate: string;
  currentWeight: number;
  photoUrl: string;
  dailyGoals: DailyGoals;
  catchPhrase: string;
};

export type PetProfile = DogProfile;

export type GrowthRecord = {
  id: string;
  date: string;
  taijyuu: number;
  appetite: Appetite;
  energyLevel: EnergyLevel;
  poopCondition: PoopCondition;
  memo: string;
  photoUrl: string;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  notify: boolean;
  reminderMinutes: number;
  memo: string;
  createdAt: string;
};

export type HealthRecord = {
  id: string;
  date: string;
  type: HealthRecordType;
  title: string;
  hospital: string;
  doctorNote: string;
  nextDueDate: string;
  memo: string;
  createdAt: string;
};

export type ActivityRecord = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  category: ActivityCategory;
  kind: ActivityKind;
  memo: string;
  createdAt: string;
};

export type FoodItem = {
  id: string;
  productName: string;
  maker: string;
  category: FoodCategory;
  caloriesPer100g: number;
  servingSize: number;
  mealRecommendations?: Partial<Record<MealType, number>>;
  memo: string;
  openedDate: string;
  price: number | null;
  contentAmount: number | null;
};

export type MealRecord = {
  id: string;
  date: string;
  time: string;
  mealType: MealType;
  foodItemId: string;
  grams: number;
  leftoverRate: number;
  memo: string;
  createdAt: string;
};

export type ExpenseRecord = {
  id: string;
  date: string;
  category: ExpenseCategory;
  itemName: string;
  amount: number;
  payee: string;
  memo: string;
  createdAt: string;
};

export type WeightRecord = GrowthRecord;
export type ScheduleItem = CalendarEvent;

export type AppData = {
  profile: DogProfile;
  records: GrowthRecord[];
  events: CalendarEvent[];
  healthRecords: HealthRecord[];
  activityRecords: ActivityRecord[];
  mealRecords: MealRecord[];
  foodItems: FoodItem[];
  expenseRecords: ExpenseRecord[];
};
