import { NextResponse } from "next/server";
import { createSyncSessionToken, getSyncSessionToken, readServerSyncConfig, reserveSyncLoginAttempt, revokeSyncSessionToken, syncCookieName, syncSessionMaxAge, verifySyncPasscode } from "@/lib/sync-auth";

export const runtime = "nodejs";

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", ...headers } });
}
function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: syncSessionMaxAge
  };
}

async function readPasscode(request: Request): Promise<string | null> {
  if (!request.headers.get("content-type")?.startsWith("application/json") || Number(request.headers.get("content-length")) > 2048) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  const deadline = AbortSignal.timeout(5000);
  const abort = () => { void reader.cancel().catch(() => null); };
  deadline.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (deadline.aborted) return null;
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { void reader.cancel().catch(() => null); return null; }
      chunks.push(value);
    }
    const payload: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!payload || typeof payload !== "object" || !("passcode" in payload) || typeof payload.passcode !== "string") return null;
    const code = payload.passcode.trim();
    return code.length > 0 && code.length <= 512 ? code : null;
  } catch { return null; }
  finally { deadline.removeEventListener("abort", abort); reader.releaseLock(); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ message: "アプリからもう一度操作してください。" }, 403);
  const { isConfigured } = readServerSyncConfig();
  if (!isConfigured) {
    return json({ message: "クラウド同期はまだ設定されていません。" }, 503);
  }

  const passcode = await readPasscode(request);
  if (passcode === null) return json({ message: "同期コードの入力を確認してください。" }, 400);
  try {
    const attempt = await reserveSyncLoginAttempt();
    if (!attempt.allowed) return json({ message: "同期コードの試行が続いています。最大5分待ってからお試しください。" }, 429, { "Retry-After": String(attempt.retry_after) });
    if (!verifySyncPasscode(passcode)) return json({ message: "同期コードが正しくありません。" }, 401);
    const token = await createSyncSessionToken();
    await revokeSyncSessionToken(getSyncSessionToken(request));
    const response = json({ ok: true });
    response.cookies.set(syncCookieName, token, buildCookieOptions());
    return response;
  } catch {
    return json({ message: "認証に接続できません。初回はSupabaseで認証用SQLを実行してください。" }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ message: "アプリからもう一度操作してください。" }, 403);
  try {
    await revokeSyncSessionToken(getSyncSessionToken(request));
    const response = json({ ok: true });
    response.cookies.set(syncCookieName, "", { ...buildCookieOptions(), maxAge: 0 });
    return response;
  } catch {
    return json({ message: "ログアウトできませんでした。通信を確認してもう一度お試しください。" }, 503);
  }
}
