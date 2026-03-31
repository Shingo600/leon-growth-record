import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppData } from "@/lib/types";
import { normalizeAppData } from "@/lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const workspaceId = process.env.NEXT_PUBLIC_LEON_WORKSPACE_ID;
const tableName = "app_snapshots";

let browserClient: SupabaseClient | null = null;

type CloudResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatSupabaseError(message: string) {
  if (message.toLowerCase().includes("statement timeout")) {
    return "通信が混み合って保存に時間がかかりました。少し待ってから再度お試しください。";
  }

  if (message.toLowerCase().includes("network")) {
    return "通信状態が不安定なため保存できませんでした。接続を確認して再度お試しください。";
  }

  return message;
}

async function withRetry<T>(task: () => Promise<CloudResult<T>>, retries = 1): Promise<CloudResult<T>> {
  let lastResult = await task();

  for (let index = 0; index < retries; index += 1) {
    if (lastResult.ok) {
      return lastResult;
    }

    if (!lastResult.message.toLowerCase().includes("statement timeout")) {
      return lastResult;
    }

    await sleep(400);
    lastResult = await task();
  }

  return lastResult;
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && workspaceId);
}

export function getSupabaseWorkspaceId() {
  return workspaceId ?? "";
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return browserClient;
}

export async function fetchCloudAppData() {
  return withRetry(async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !workspaceId) {
      return { ok: false as const, message: "Supabase is not configured." };
    }

    const { data, error } = await client
      .from(tableName)
      .select("data")
      .eq("id", workspaceId)
      .maybeSingle();

    if (error) {
      return { ok: false as const, message: formatSupabaseError(error.message) };
    }

    if (!data?.data) {
      return { ok: true as const, data: null };
    }

    return {
      ok: true as const,
      data: normalizeAppData(data.data as Partial<AppData>)
    };
  });
}

export async function saveCloudAppData(appData: AppData) {
  return withRetry(async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !workspaceId) {
      return { ok: false as const, message: "Supabase is not configured." };
    }

    const { error } = await client.from(tableName).upsert(
      {
        id: workspaceId,
        data: appData,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    if (error) {
      return { ok: false as const, message: formatSupabaseError(error.message) };
    }

    return { ok: true as const, data: null };
  }).then((result) => {
    if (!result.ok) {
      return result;
    }

    return { ok: true as const };
  });
}
