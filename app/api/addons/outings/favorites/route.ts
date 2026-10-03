import { createHash } from "node:crypto";
import { authorize, body, database, fail, json, OutingsError } from "@/lib/addons/outings/server";
import { object, parseBackup, parseFavorite } from "@/lib/addons/outings/validation";
export const dynamic = "force-dynamic";

async function list() {
  const { db, workspace } = database();
  const result = await db.from("addon_outing_favorites").select("id,data,saved_at").eq("workspace_id", workspace).order("saved_at", { ascending: false }).limit(200);
  if (result.error) throw new OutingsError("保存した場所を読み込めませんでした。", 503);
  return result.data.map(row => ({ ...row.data, id: row.id, savedAt: row.saved_at }));
}
export async function GET(request: Request) {
  try { await authorize(request); return json({ favorites: await list() }); }
  catch (error) { return fail(error); }
}
export async function POST(request: Request) {
  try {
    await authorize(request, true);
    const payload = object(await body(request, 1500000));
    let items;
    try { items = payload.backup ? parseBackup(payload.backup) : [parseFavorite(payload.favorite)]; }
    catch (error) { throw new OutingsError(error instanceof Error ? error.message : "保存内容を確認してください。"); }
    const entries = items.map(item => ({ ...item, id: createHash("sha256").update(item.url).digest("hex") }));
    const { db, workspace } = database();
    const result = await db.rpc("mutate_outing_favorites", { p_workspace: workspace, p_items: entries });
    if (result.error) throw new OutingsError(result.error.message.includes("OUTINGS_FAVORITES_LIMIT") ? "保存できる場所は200件までです。" : "保存できませんでした。追加設定と接続状況を確認してください。", 503);
    return json({ favorites: await list() });
  } catch (error) { return fail(error); }
}
export async function DELETE(request: Request) {
  try {
    await authorize(request, true);
    const payload = object(await body(request));
    if (typeof payload.id !== "string" || !/^[a-f0-9]{64}$/.test(payload.id)) throw new OutingsError("解除する場所を確認してください。");
    const { db, workspace } = database();
    const result = await db.rpc("mutate_outing_favorites", { p_workspace: workspace, p_items: [], p_delete: payload.id });
    if (result.error) throw new OutingsError("保存を解除できませんでした。", 503);
    return json({ favorites: await list() });
  } catch (error) { return fail(error); }
}
