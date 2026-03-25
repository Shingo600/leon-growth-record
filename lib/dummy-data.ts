import { AppData } from "@/lib/types";

export const defaultAppData: AppData = {
  profile: {
    name: "レオン",
    breed: "トイプードル",
    birthday: "2024-04-12",
    gender: "オス",
    arrivalDate: "2024-06-01",
    currentWeight: 3.8
  },
  records: [
    {
      id: "record-1",
      date: "2026-03-22",
      taijyuu: 3.8,
      appetite: "良い",
      energyLevel: "元気",
      poopCondition: "良い",
      memo: "朝のお散歩を長めにできました。食欲も安定しています。",
      photoUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
      createdAt: "2026-03-22T08:00:00.000Z"
    },
    {
      id: "record-2",
      date: "2026-03-18",
      taijyuu: 3.7,
      appetite: "普通",
      energyLevel: "元気",
      poopCondition: "良い",
      memo: "新しいおやつを少しだけ試しました。",
      photoUrl: "",
      createdAt: "2026-03-18T08:00:00.000Z"
    },
    {
      id: "record-3",
      date: "2026-03-10",
      taijyuu: 3.6,
      appetite: "良い",
      energyLevel: "普通",
      poopCondition: "柔らかい",
      memo: "雨で運動が少なめの日でした。",
      photoUrl: "",
      createdAt: "2026-03-10T08:00:00.000Z"
    }
  ],
  events: [
    {
      id: "event-1",
      title: "春のワクチン相談",
      date: "2026-03-23",
      time: "10:30",
      type: "病院",
      notify: true,
      reminderMinutes: 60,
      memo: "体重のメモも持っていく",
      createdAt: "2026-03-21T09:00:00.000Z"
    },
    {
      id: "event-2",
      title: "トリミング予約",
      date: "2026-03-26",
      time: "14:00",
      type: "シャンプー",
      notify: false,
      reminderMinutes: 0,
      memo: "足回りを少し短めに",
      createdAt: "2026-03-21T10:00:00.000Z"
    },
    {
      id: "event-3",
      title: "朝のお散歩",
      date: "2026-03-22",
      time: "07:00",
      type: "散歩",
      notify: false,
      reminderMinutes: 0,
      memo: "公園コース",
      createdAt: "2026-03-21T11:00:00.000Z"
    }
  ],
  healthRecords: [
    {
      id: "health-1",
      date: "2026-03-05",
      type: "ワクチン",
      title: "混合ワクチン",
      hospital: "レオン動物クリニック",
      doctorNote: "体調安定。次回も春ごろ予定。",
      nextDueDate: "2027-03-05",
      memo: "接種後は安静に過ごした。",
      createdAt: "2026-03-05T09:30:00.000Z"
    },
    {
      id: "health-2",
      date: "2026-02-10",
      type: "通院",
      title: "定期健診",
      hospital: "レオン動物クリニック",
      doctorNote: "耳の中もきれいで問題なし。",
      nextDueDate: "",
      memo: "体重3.7kgで維持。",
      createdAt: "2026-02-10T11:00:00.000Z"
    },
    {
      id: "health-3",
      date: "2026-01-21",
      type: "投薬",
      title: "フィラリア予防薬",
      hospital: "レオン動物クリニック",
      doctorNote: "",
      nextDueDate: "2026-04-21",
      memo: "朝ごはんの後に服用。",
      createdAt: "2026-01-21T08:15:00.000Z"
    }
  ]
};
