export type DogGender = "オス" | "メス" | "不明";
export type Appetite = "良い" | "普通" | "悪い";
export type EnergyLevel = "元気" | "普通" | "元気なし";
export type PoopCondition = "良い" | "柔らかい" | "下痢";
export type EventType = "散歩" | "病院" | "薬" | "シャンプー" | "その他";
export type HealthRecordType = "ワクチン" | "通院" | "投薬" | "検査" | "その他";
export type GraphRange = "1週間" | "1か月" | "全期間";

export type DogProfile = {
  name: string;
  breed: string;
  birthday: string;
  gender: DogGender;
  arrivalDate: string;
  currentWeight: number;
};

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

export type AppData = {
  profile: DogProfile;
  records: GrowthRecord[];
  events: CalendarEvent[];
  healthRecords: HealthRecord[];
};
