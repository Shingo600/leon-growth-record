import { AppData } from "@/lib/types";

export const defaultAppData: AppData = {
  profile: {
    name: "レオン",
    breed: "トイプードル",
    birthday: "2024-04-12",
    gender: "オス",
    arrivalDate: "2024-06-01",
    currentWeight: 3.8,
    photoUrl: "/placeholder-dog.svg",
    dailyGoals: {
      walkMinutes: 60,
      intelligenceMinutes: 15,
      trainingMinutes: 10
    },
    catchPhrase: "今日はどんな発見があるかな"
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
  ],
  activityRecords: [
    {
      id: "activity-1",
      date: "2026-03-26",
      startTime: "07:20",
      durationMinutes: 45,
      category: "散歩",
      kind: "散歩",
      memo: "公園を一周してゆっくり歩いた",
      createdAt: "2026-03-26T07:20:00.000Z"
    },
    {
      id: "activity-2",
      date: "2026-03-26",
      startTime: "13:10",
      durationMinutes: 10,
      category: "知育遊び",
      kind: "ノーズワーク",
      memo: "おやつ探しを室内で実施",
      createdAt: "2026-03-26T13:10:00.000Z"
    },
    {
      id: "activity-3",
      date: "2026-03-26",
      startTime: "19:00",
      durationMinutes: 5,
      category: "トレーニング",
      kind: "コマンド練習",
      memo: "おすわりと待てを復習",
      createdAt: "2026-03-26T19:00:00.000Z"
    }
  ],
  foodItems: [
    {
      id: "food-1",
      productName: "シュプレモ 子犬用",
      maker: "ニュートロ",
      category: "ドライ",
      caloriesPer100g: 380,
      servingSize: 55,
      memo: "ふやかして食べやすくしている",
      openedDate: "2026-03-15",
      price: 2980,
      contentAmount: 2000
    },
    {
      id: "food-2",
      productName: "ささみ細切り",
      maker: "ごほうびキッチン",
      category: "おやつ",
      caloriesPer100g: 290,
      servingSize: 12,
      memo: "トレーニングのごほうび用",
      openedDate: "",
      price: 498,
      contentAmount: 120
    },
    {
      id: "food-3",
      productName: "乳酸菌サプリ",
      maker: "ワンヘルス",
      category: "サプリ",
      caloriesPer100g: 120,
      servingSize: 3,
      memo: "お腹の調子を見ながら使用",
      openedDate: "",
      price: 1680,
      contentAmount: 90
    }
  ],
  mealRecords: [
    {
      id: "meal-1",
      date: "2026-03-26",
      time: "07:10",
      mealType: "朝",
      foodItemId: "food-1",
      grams: 55,
      leftoverRate: 0,
      memo: "",
      createdAt: "2026-03-26T07:10:00.000Z"
    },
    {
      id: "meal-2",
      date: "2026-03-26",
      time: "13:30",
      mealType: "おやつ",
      foodItemId: "food-2",
      grams: 12,
      leftoverRate: 0,
      memo: "ノーズワーク後に少しだけ",
      createdAt: "2026-03-26T13:30:00.000Z"
    },
    {
      id: "meal-3",
      date: "2026-03-26",
      time: "18:40",
      mealType: "夜",
      foodItemId: "food-1",
      grams: 60,
      leftoverRate: 0,
      memo: "",
      createdAt: "2026-03-26T18:40:00.000Z"
    }
  ],
  expenseRecords: [
    {
      id: "expense-1",
      date: "2026-03-26",
      category: "トリミング",
      itemName: "春のトリミング",
      amount: 6500,
      payee: "ふわふわトリミング",
      memo: "耳まわりをすっきり",
      createdAt: "2026-03-26T14:00:00.000Z"
    },
    {
      id: "expense-2",
      date: "2026-03-24",
      category: "フード",
      itemName: "シュプレモ 子犬用",
      amount: 2980,
      payee: "ペットショップ",
      memo: "",
      createdAt: "2026-03-24T12:00:00.000Z"
    },
    {
      id: "expense-3",
      date: "2026-03-18",
      category: "病院",
      itemName: "ワクチン",
      amount: 8000,
      payee: "レオン動物クリニック",
      memo: "診察料込み",
      createdAt: "2026-03-18T10:30:00.000Z"
    },
    {
      id: "expense-4",
      date: "2026-02-20",
      category: "おもちゃ",
      itemName: "知育トイ",
      amount: 1480,
      payee: "オンラインショップ",
      memo: "",
      createdAt: "2026-02-20T09:00:00.000Z"
    }
  ]
};
