import { authenticated, config, database, json, todayJst } from "@/lib/addons/outings/server";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const settings = config();
  const status = { enabled: settings.enabled, authenticated: authenticated(request), ready: false,
    storageReady: false, remaining: null as number | null, message: "", cacheScope: undefined as string | undefined };
  if (!status.authenticated) return json({ ...status, message: "家族の同期コードでおでかけ機能を利用できます。" });
  try {
    const { db, workspace, cacheScope } = database();
    const [usage, favorites] = await Promise.all([
      db.from("addon_ai_usage").select("request_ids").eq("workspace_id", workspace).eq("usage_date", todayJst()).maybeSingle(),
      db.from("addon_outing_favorites").select("id").eq("workspace_id", workspace).limit(1)
    ]);
    if (usage.error || favorites.error) return json({ ...status, message: "おでかけの保存先に接続できません。初回は追加設定が必要です。", cacheScope });
    status.storageReady = true;
    status.cacheScope = cacheScope;
    status.remaining = Math.max(0, settings.limit - (usage.data?.request_ids?.length ?? 0));
    status.ready = settings.enabled && Boolean(settings.key);
    status.message = !settings.enabled ? "AI検索は準備中です。行きたい場所は保存できます。" : !settings.key ? "AI検索の設定はまだ完了していません。" : "";
    return json(status);
  } catch { return json({ ...status, message: "おでかけの保存先に接続できません。設定または接続状況を確認してください。" }); }
}
