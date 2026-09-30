import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { readServerSyncConfig, syncCookieName, verifySyncSessionToken } from "@/lib/sync-auth";

export class OutingsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
export function fail(error: unknown) {
  return json({ message: error instanceof OutingsError ? error.message : "接続できませんでした。時間をおいて再度お試しください。" }, error instanceof OutingsError ? error.status : 503);
}
export function authenticated(request: Request) {
  const token = (request.headers.get("cookie") ?? "").split(";").map(x => x.trim()).find(x => x.startsWith(`${syncCookieName}=`))?.slice(syncCookieName.length + 1);
  return verifySyncSessionToken(token);
}
export function config() {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.OUTINGS_AI_MODEL?.trim() || "gpt-4.1-mini";
  return { key, model, enabled: process.env.OUTINGS_ADDON_ENABLED === "true" };
}
export function authorize(request: Request, mutation = false) {
  if (!authenticated(request)) throw new OutingsError("家族の同期コードを入力してください。", 401);
  if (mutation) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) throw new OutingsError("この画面からもう一度操作してください。", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new OutingsError("JSON形式で送信してください。", 415);
  }
}
export function database() {
  const sync = readServerSyncConfig();
  if (!sync.isConfigured || !sync.supabaseUrl || !sync.serviceRoleKey || !sync.workspaceId) throw new OutingsError("共有保存の設定がまだ完了していません。", 503);
  return { workspace: sync.workspaceId, cacheScope: createHash("sha256").update(sync.workspaceId).digest("hex").slice(0, 24),
    db: createClient(sync.supabaseUrl, sync.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(10000) }) } }) };
}
export function todayJst() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
export async function body(request: Request, limit = 16000): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit) throw new OutingsError("データが大きすぎます。", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new OutingsError("入力内容を確認してください。");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new OutingsError("データが大きすぎます。", 413); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof OutingsError) throw error;
    throw new OutingsError("入力データを読み取れませんでした。");
  } finally { reader.releaseLock(); }
}
