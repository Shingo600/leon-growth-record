import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppData } from "@/lib/types";
import { normalizeAppData } from "@/lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const workspaceId = process.env.NEXT_PUBLIC_LEON_WORKSPACE_ID;
const tableName = "app_snapshots";

let browserClient: SupabaseClient | null = null;

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
    return { ok: false as const, message: error.message };
  }

  if (!data?.data) {
    return { ok: true as const, data: null };
  }

  return {
    ok: true as const,
    data: normalizeAppData(data.data as Partial<AppData>)
  };
}

export async function saveCloudAppData(appData: AppData) {
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
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}
