import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeAppData } from "@/lib/storage";
import type { AppData } from "@/lib/types";
import { readServerSyncConfig, syncCookieName, verifySyncSessionToken } from "@/lib/sync-auth";

const tableName = "app_snapshots";

function getServerClient() {
  const { configError, supabaseUrl, serviceRoleKey, workspaceId, isConfigured } = readServerSyncConfig();
  if (!isConfigured || !supabaseUrl || !serviceRoleKey || !workspaceId) {
    return { error: configError || "クラウド同期の環境変数が不足しています。" } as const;
  }

  return {
    workspaceId,
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  };
}

function ensureAuthorized(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${syncCookieName}=`))
    ?.slice(syncCookieName.length + 1);

  return verifySyncSessionToken(token);
}

export async function GET(request: Request) {
  const server = getServerClient();
  if ("error" in server) {
    return NextResponse.json({ message: server.error }, { status: 503 });
  }

  if (!ensureAuthorized(request)) {
    return NextResponse.json({ message: "同期コードを入力してください。" }, { status: 401 });
  }

  let result;
  try {
    result = await server.client.from(tableName).select("data").eq("id", server.workspaceId).maybeSingle();
  } catch (error) {
    result = { data: null, error };
  }
  const { data, error } = result;

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: `Supabaseへの接続に失敗しました: ${message}` }, { status: 500 });
  }

  if (!data?.data) {
    return NextResponse.json({ data: null }, { status: 200 });
  }

  return NextResponse.json({ data: normalizeAppData(data.data as Partial<AppData>) }, { status: 200 });
}

export async function PUT(request: Request) {
  const server = getServerClient();
  if ("error" in server) {
    return NextResponse.json({ message: server.error }, { status: 503 });
  }

  if (!ensureAuthorized(request)) {
    return NextResponse.json({ message: "同期コードを入力してください。" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Partial<AppData> | null;
  if (!payload) {
    return NextResponse.json({ message: "保存データを読み取れませんでした。" }, { status: 400 });
  }

  const appData = normalizeAppData(payload);
  let result;
  try {
    result = await server.client.from(tableName).upsert(
      {
        id: server.workspaceId,
        data: appData,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );
  } catch (error) {
    result = { error };
  }
  const { error } = result;

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: `Supabaseへの保存に失敗しました: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
