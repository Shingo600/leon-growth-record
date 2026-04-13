import { createHash, timingSafeEqual } from "node:crypto";

export const syncCookieName = "leon-sync-session";

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

export function readServerSyncConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const workspaceId = process.env.LEON_WORKSPACE_ID ?? process.env.NEXT_PUBLIC_LEON_WORKSPACE_ID;
  const syncPasscode = process.env.LEON_SYNC_PASSCODE;

  return {
    supabaseUrl,
    serviceRoleKey,
    workspaceId,
    syncPasscode,
    isConfigured: Boolean(supabaseUrl && serviceRoleKey && workspaceId && syncPasscode)
  };
}

export function createSyncSessionToken(passcode: string) {
  return hashSyncValue(passcode);
}

export function verifySyncPasscode(passcode: string) {
  const { syncPasscode } = readServerSyncConfig();
  if (!syncPasscode) {
    return false;
  }

  return safeEqualHash(hashSyncValue(passcode), hashSyncValue(syncPasscode));
}

export function verifySyncSessionToken(token: string | undefined) {
  const { syncPasscode } = readServerSyncConfig();
  if (!token || !syncPasscode) {
    return false;
  }

  return safeEqualHash(token, createSyncSessionToken(syncPasscode));
}
