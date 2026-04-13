import { NextResponse } from "next/server";
import { createSyncSessionToken, readServerSyncConfig, syncCookieName, verifySyncPasscode } from "@/lib/sync-auth";

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  };
}

export async function POST(request: Request) {
  const { isConfigured } = readServerSyncConfig();
  if (!isConfigured) {
    return NextResponse.json({ message: "クラウド同期はまだ設定されていません。" }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as { passcode?: string } | null;
  const passcode = payload?.passcode?.trim() ?? "";

  if (!passcode || !verifySyncPasscode(passcode)) {
    return NextResponse.json({ message: "同期コードが正しくありません。" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(syncCookieName, createSyncSessionToken(passcode), buildCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(syncCookieName, "", {
    ...buildCookieOptions(),
    maxAge: 0
  });
  return response;
}
