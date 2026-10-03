import { authorize, body, config, database, fail, json, OutingsError } from "@/lib/addons/outings/server";
import { parseSearch } from "@/lib/addons/outings/validation";
import { searchPlaces } from "@/lib/addons/outings/provider";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await authorize(request, true);
    const settings = config();
    if (!settings.enabled || !settings.key) throw new OutingsError("AI検索はまだ利用できません。", 503);
    let input;
    try { input = parseSearch(await body(request)); }
    catch (error) { throw error instanceof OutingsError ? error : new OutingsError(error instanceof Error ? error.message : "入力を確認してください。"); }
    const { db, workspace } = database();
    const reservation = await db.rpc("reserve_outing_search", { p_workspace: workspace, p_request: input.requestId, p_limit: 0 });
    if (reservation.error || typeof reservation.data?.allowed !== "boolean") throw new OutingsError("検索を準備できませんでした。保存先の設定を確認してください。", 503);
    if (!reservation.data.allowed) throw new OutingsError(reservation.data.reason === "duplicate" ? "この検索はすでに受け付けています。再検索する場合はもう一度ボタンを押してください。" : "検索を準備できませんでした。保存先の設定を確認してください。", reservation.data.reason === "duplicate" ? 409 : 503);
    try {
      const result = await searchPlaces(input, settings.key, settings.model);
      const { requestId: _, ...query } = input;
      return json({ ...result, query });
    } catch (error) {
      // A provider may bill even when the connection fails. Never refund/retry automatically.
      return json({ message: error instanceof Error && error.name === "TimeoutError" ? "検索に時間がかかっています。少し時間をおいて再度お試しください。" : error instanceof Error ? error.message : "検索に失敗しました。" }, 502);
    }
  } catch (error) { return fail(error); }
}
