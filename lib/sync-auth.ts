import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const syncCookieName = "leon-sync-session";
export const syncSessionMaxAge = 60 * 60 * 24 * 30;

export function hashSyncValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqualHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeSupabaseUrl(rawUrl: string | undefined) {
  const value = rawUrl?.trim();
  if (!value) {
    return { supabaseUrl: undefined, configError: "SUPABASE_URL が設定されていません。" };
  }

  if (/^[a-z0-9]{20}$/.test(value)) {
    return { supabaseUrl: `https://${value}.supabase.co`, configError: "" };
  }

  try {
    const url = new URL(value);

    const dashboardProjectRef = url.pathname.match(/\/project\/([a-z0-9]{20})/i)?.[1];
    if (url.hostname === "supabase.com" && dashboardProjectRef) {
      return { supabaseUrl: `https://${dashboardProjectRef}.supabase.co`, configError: "" };
    }

    if (url.hostname.endsWith(".supabase.co")) {
      return { supabaseUrl: url.origin, configError: "" };
    }
  } catch {
    return {
      supabaseUrl: undefined,
      configError: "SUPABASE_URL は https://xxxxx.supabase.co の形式で設定してください。"
    };
  }

  return {
    supabaseUrl: undefined,
    configError: "SUPABASE_URL は https://xxxxx.supabase.co の形式で設定してください。"
  };
}

export function readServerSyncConfig() {
  const { supabaseUrl, configError } = normalizeSupabaseUrl(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const workspaceId = process.env.LEON_WORKSPACE_ID ?? process.env.NEXT_PUBLIC_LEON_WORKSPACE_ID;
  const syncPasscode = process.env.LEON_SYNC_PASSCODE;

  return {
    supabaseUrl,
    serviceRoleKey,
    workspaceId,
    syncPasscode,
    configError,
    isConfigured: Boolean(supabaseUrl && serviceRoleKey && workspaceId && syncPasscode && !configError)
  };
}

function sessionDatabase() {
  const config = readServerSyncConfig();
  if (!config.isConfigured || !config.supabaseUrl || !config.serviceRoleKey || !config.workspaceId || !config.syncPasscode) {
    throw new Error("同期の設定が不足しています。");
  }
  return {
    workspace: config.workspaceId,
    // A code/key rotation invalidates existing sessions without storing the code.
    version: createHmac("sha256", config.serviceRoleKey).update(`leon-sync-v2\0${config.workspaceId}\0${config.syncPasscode}`).digest("hex"),
    db: createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(10000) }) }
    })
  };
}

export function getSyncSessionToken(request: Request) {
  return (request.headers.get("cookie") ?? "").split(";").map(part => part.trim())
    .find(part => part.startsWith(`${syncCookieName}=`))?.slice(syncCookieName.length + 1);
}

function isSessionToken(token: string | undefined): token is string {
  return typeof token === "string" && /^v2\.[a-f0-9]{64}$/.test(token);
}

export async function reserveSyncLoginAttempt() {
  const { workspace, db } = sessionDatabase();
  const { data, error } = await db.rpc("reserve_sync_login_attempt", { p_workspace: workspace });
  if (error || typeof data?.allowed !== "boolean" || !Number.isInteger(data.retry_after) || data.retry_after < 0 || data.retry_after > 300) {
    throw new Error("認証の保存先が未設定か、接続できません。Supabaseの認証用SQLを確認してください。");
  }
  return data as { allowed: boolean; retry_after: number };
}

export async function createSyncSessionToken() {
  const { workspace, version, db } = sessionDatabase();
  const token = `v2.${randomBytes(32).toString("hex")}`;
  const { error } = await db.rpc("issue_sync_session", { p_workspace: workspace, p_token_hash: hashSyncValue(token), p_code_version: version });
  if (error) throw new Error("ログイン情報を保存できませんでした。");
  return token;
}

export function verifySyncPasscode(passcode: string) {
  const { syncPasscode } = readServerSyncConfig();
  if (!syncPasscode) {
    return false;
  }

  return safeEqualHash(hashSyncValue(passcode), hashSyncValue(syncPasscode));
}

export async function verifySyncSessionToken(token: string | undefined) {
  // Never accept the legacy SHA256(code) cookie, even as a migration fallback.
  if (!isSessionToken(token)) return false;
  try {
    const { workspace, version, db } = sessionDatabase();
    const { data, error } = await db.rpc("validate_sync_session", { p_workspace: workspace, p_token_hash: hashSyncValue(token), p_code_version: version });
    return !error && data === true;
  } catch { return false; }
}

export async function revokeSyncSessionToken(token: string | undefined) {
  if (!isSessionToken(token)) return;
  const { workspace, db } = sessionDatabase();
  const { error } = await db.from("sync_sessions").delete().eq("workspace_id", workspace).eq("token_hash", hashSyncValue(token));
  if (error) throw new Error("ログイン情報を無効にできませんでした。");
}
