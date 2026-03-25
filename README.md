# レオン成長記録

愛犬の毎日の成長記録と予定管理を、1つのスマホ向け画面で扱うための Next.js MVP アプリです。  
まずは `localStorage` 保存で確実に動く構成にし、将来の通知機能や家族共有へ広げやすいように整理しています。

## プロジェクト構成

```text
leon-growth-record/
├─ app/
│  ├─ calendar/page.tsx
│  ├─ events/new/page.tsx
│  ├─ health/page.tsx
│  ├─ health/new/page.tsx
│  ├─ profile/page.tsx
│  ├─ records/page.tsx
│  ├─ records/new/page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ app-provider.tsx
│  ├─ app-shell.tsx
│  ├─ calendar-month.tsx
│  ├─ event-form.tsx
│  ├─ health-form.tsx
│  ├─ profile-form.tsx
│  ├─ record-form.tsx
│  └─ weight-chart.tsx
├─ lib/
│  ├─ dummy-data.ts
│  ├─ storage.ts
│  ├─ types.ts
│  └─ utils.ts
├─ package.json
├─ tailwind.config.ts
└─ tsconfig.json
```

## 依存関係

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `recharts`

## 実装済みのMVP機能

- 犬プロフィール管理
- 成長記録の追加と一覧表示
- 成長記録の編集と削除
- 成長記録の検索と絞り込み
- 端末画像アップロードの簡易対応
- 予定の追加と一覧表示
- 予定の編集と削除
- 予定の検索と絞り込み
- 健康履歴の追加、編集、削除
- 健康履歴の検索と絞り込み
- 月表示カレンダー
- 体重推移グラフ
- ホームでの最新情報表示
- PWA対応でホーム画面追加が可能
- 簡易オフライン対応
- `localStorage` 永続化
- JSONバックアップと復元
- 通知タイミング設定の保存
- ブラウザ通知による予定リマインド
- 初期ダミーデータ読み込み

## 起動方法

### 1. Node.js を準備

Node.js 18 以上をインストールしてください。  
Windows ではインストール後に新しいターミナルを開き直すと `node` と `npm` が使えるようになります。

### 2. 依存関係をインストール

```bash
cd leon-growth-record
npm install
```

### 3. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと確認できます。

### 4. スマホで確認

同じWi-Fi内のスマホから使う場合は、PCのIPアドレスを使ってアクセスします。

```bash
npm run dev -- --hostname 0.0.0.0
```

例:

```text
http://192.168.0.10:3000
```

スマホで開いたあと、ホーム画面追加を行うとアプリのように使えます。

## Vercel公開

### 1. GitHub に push

このフォルダを GitHub リポジトリへ push します。

### 2. Vercel に読み込む

- Vercel にログイン
- `Add New...` から `Project`
- GitHub リポジトリを選択
- Framework は `Next.js` のままでOK

### 3. デプロイ

特別な環境変数は不要です。  
そのまま `Deploy` で公開できます。

### 4. 公開後の注意

- 今の保存方式は `localStorage` なので、端末ごとにデータは別です
- PCで入力したデータはスマホには自動共有されません
- 端末間共有まで必要な場合は、次に Supabase などのクラウド保存が必要です

## 使い方

- ホーム: 今日の予定、最新体重、最新記録を確認
- 成長記録一覧: 体重推移グラフと過去記録を確認
- 成長記録一覧: 各カードから編集と削除が可能
- 成長記録一覧: 食欲、元気度、うんち状態、メモで絞り込み可能
- 成長記録入力: 体重、体調、写真URL、端末画像、メモを保存
- カレンダー: 月表示と予定一覧を確認
- カレンダー: 各予定カードから編集と削除が可能
- カレンダー: 種類、通知有無、キーワードで予定を絞り込み可能
- 予定追加: 散歩や病院などを登録し、通知タイミングを保存
- 健康履歴: ワクチン、通院、投薬、検査の履歴を追加・編集・削除
- 健康履歴: 種類、病院名、メモ、日付で絞り込み可能
- プロフィール: 犬の基本情報を編集
- プロフィール: バックアップの書き出しと復元が可能
- 画面上部の通知カード: ブラウザ通知を許可
- 画面上部のインストールカード: ホーム画面に追加

## 補足

- 画像はMVPでは `localStorage` にデータURLとして保存します
- 大きな画像を多く保存するとブラウザ保存容量に達しやすいため、2MB以下の軽い画像を推奨します
- 通知は `localhost` などの対応環境でブラウザ許可が必要です
- MVPの通知はアプリを開いている間に動作します
- オフライン時は事前に開いた画面を中心に簡易表示できます

## 今後の拡張案

- 画像アップロードを `input type="file"` と IndexedDB またはクラウド保存に対応
- Web Push や端末通知による予定リマインド
- 家族共有のためのログイン機能とクラウド同期
- 薬の在庫管理
- グラフ種類の追加
- CSV / PDF 出力
- PWA 化してホーム画面追加しやすくする
