import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseAppData } from "@/lib/storage";
import { readServerSyncConfig, syncCookieName, verifySyncSessionToken } from "@/lib/sync-auth";

const tableName = "app_snapshots";

function formatUnknownError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

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

  if (!(await ensureAuthorized(request))) {
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
    const message = formatUnknownError(error);
    return NextResponse.json({ message: `Supabaseへの接続に失敗しました: ${message}` }, { status: 500 });
  }

  const headers = { "Cache-Control": "private, no-store" };
  if (!data) {
    return NextResponse.json({ data: null }, { headers });
  }

  const appData = parseAppData(data.data);
  if (!appData) {
    return NextResponse.json({ message: "共有データの形式が不正です。保存済みデータは変更していません。" }, { status: 409, headers });
  }
  return NextResponse.json({ data: appData }, { headers });
}

export async function PUT(request: Request) {
  const server = getServerClient();
  if ("error" in server) {
    return NextResponse.json({ message: server.error }, { status: 503 });
  }

  if (!(await ensureAuthorized(request))) {
    return NextResponse.json({ message: "同期コードを入力してください。" }, { status: 401 });
  }

  const appData = parseAppData(await request.json().catch(() => null), true);
  if (!appData) {
    return NextResponse.json({ message: "保存データの形式が不正です。共有データは変更していません。" }, { status: 400 });
  }

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
    const message = formatUnknownError(error);
    return NextResponse.json({ message: `Supabaseへの保存に失敗しました: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
