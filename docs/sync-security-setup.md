# 認証のセキュリティ更新

## 反映の順番

1. Supabaseを再開し、SQL Editorで `supabase/migrations/20261002235125_sync_security.sql` 全文を実行する。
2. エラーがなければ、新しいコードをVercelへデプロイする。古いデプロイのRedeployだけでは、このコード変更は反映されない。
3. PC・iPhoneそれぞれでアプリを開き直し、プロフィールの「保存と共有」からいつもの同期コードを一度入力する。
4. 記録の読み書き、おでかけの検索、写真追加を確認する。片方の端末でローカル保存に戻しても、もう片方の同期は続く。

SQLはログイン情報用の2テーブルと3関数を追加するだけです。既存の記録、お気に入り、写真を削除・移動しません。
新しい環境変数や有料サービスは不要です。既存のサービスキー・同期コードは変更不要です。
**SQLを先に実行してください。** 未適用では新しいコードのクラウド認証が失敗します。端末内の記録は残ります。

## 変更点

- ログインするたびに、推測できない端末別のCookieを発行する。DBに残すのはCookieのハッシュのみ。
- サーバーの時刻で30日を期限とする。期限切れ、ログアウト済み、同期コード・サービスキー変更前のCookieは拒否する。
- 旧形式のCookieは受け入れないため、更新後は各端末で一度再接続が必要。
- ログアウトは現在のCookieに対応するログインだけを無効にする。他の家族のログインは残す。通信に失敗しても端末保存へ切り替え、失効は未完了として表示し、復旧後に「ログアウトを再試行」できる。
- 同期コードの入力は家族共通で5分間に10回まで。IPや端末を変えても同じ枠を使う。429の場合は表示に従って待つ。
- この制限は**新規ログインのみ**。接続済み端末の同期・アルバム・AI検索の回数制限は追加しない。
- 連続攻撃中は新規接続しづらくなる場合があるが、既存セッションは使える。短い数字だけの同期コードは避け、十分長いランダムなコードを使う。

## 写真の扱い

HEICは端末の標準機能を優先し、非対応の場合は既存ライブラリのブラウザー版でJPEGに変換する。
未ログインでも端末内の写真準備ができ、変換のために元画像をサーバーに送らない。
20MBの元画像制限と、保存前の1600px・軽量JPEG化は維持する。

ブラウザー用変換モジュールは必要時だけ取得する。初回のHEIC変換はオンラインで試す。
読み込み済みのモジュールはオフラインキャッシュの対象になるが、ブラウザーがキャッシュを削除した場合などのオフライン変換は保証しない。
端末のメモリ不足や非対応HEICで失敗する場合はJPEGを選ぶ。
旧 `/api/convert-heic` は410を返すだけで、アップロード本文を読んだり変換したりしない。
既存の公開写真／非公開アルバムの区分は変更しない。

## 開発検証

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node tests/security.cjs
node tests/sync-offline.cjs
node tests/outings.cjs
npm run build
```

SQLは、本番に接続しないPGlite環境でも検証できる。アプリの依存には追加しない。

```powershell
$tools = Join-Path $env:TEMP 'leon-sql-check'
npm install --prefix $tools --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.8
$env:SECURITY_PGLITE_PATH = Join-Path $tools 'node_modules/@electric-sql/pglite'
node tests/security-database.cjs
```

PGlite検証はSQLの構文・権限・期限・失効・試行枠を確認するもので、本番SupabaseのData API設定や複数接続のロック競合を再現するものではない。
公開後は実機のHEIC変換、期限とログアウト、Supabase側の権限を確認する。
古い公開デプロイが利用できる場合は、その保護または停止も確認する。今回のソース修正だけで旧デプロイのコードは変わらない。
匿名・authenticatedへの権限開放でエラーを回避しない。

参考: [Supabaseの関数と権限](https://supabase.com/docs/guides/database/functions)、[HEICライブラリのブラウザー対応](https://github.com/catdad-experiments/heic-convert#usage-in-the-browser)
