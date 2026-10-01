import { createClient } from "@supabase/supabase-js";
import { readServerSyncConfig, syncCookieName, verifySyncSessionToken } from "@/lib/sync-auth";

export const albumBucket = "leon-album";

export type AlbumRow = {
  id: string;
  workspace_id: string;
  storage_path: string;
  thumbnail_path: string;
  taken_on: string;
  caption: string;
  favorite: boolean;
  byte_size: number;
  created_at: string;
};

type AlbumClient = Extract<ReturnType<typeof getAlbumServer>, { ok: true }>["client"];

export function getAlbumServer(request: Request) {
  const config = readServerSyncConfig();
  if (!config.isConfigured || !config.supabaseUrl || !config.serviceRoleKey || !config.workspaceId) {
    return { ok: false as const, status: 503, message: config.configError || "クラウド同期の設定が必要です。" };
  }

  const token = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${syncCookieName}=`))
    ?.slice(syncCookieName.length + 1);

  if (!verifySyncSessionToken(token)) {
    return { ok: false as const, status: 401, message: "同期コードを入力してからアルバムを使ってください。" };
  }

  return {
    ok: true as const,
    workspaceId: config.workspaceId,
    client: createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  };
}

export async function ensurePrivateAlbumBucket(client: AlbumClient) {
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  const bucket = buckets.find((item) => item.name === albumBucket);
  if (bucket?.public) throw new Error("アルバム用バケットが公開設定です。非公開に変更してください。");
  if (bucket) return;

  const result = await client.storage.createBucket(albumBucket, {
    public: false,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg"]
  });
  if (result.error && !result.error.message.toLowerCase().includes("already exists")) throw result.error;
}

export function albumErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("album_photos") && (message.includes("does not exist") || message.includes("schema cache"))) {
    return "アルバムの保存先が未設定です。Supabaseで album_photos のSQLを実行してください。";
  }
  return message;
}
