import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { readServerSyncConfig, syncCookieName, verifySyncSessionToken } from "@/lib/sync-auth";

export const runtime = "nodejs";

const defaultBucketName = process.env.LEON_PHOTO_BUCKET ?? "leon-photos";

function getServerClient() {
  const { supabaseUrl, serviceRoleKey, isConfigured } = readServerSyncConfig();
  if (!isConfigured || !supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isAuthorized(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${syncCookieName}=`))
    ?.slice(syncCookieName.length + 1);

  return verifySyncSessionToken(token);
}

async function ensureBucket() {
  const client = getServerClient();
  if (!client) {
    return { ok: false as const, message: "クラウド共有はまだ設定されていません。" };
  }

  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    return { ok: false as const, message: listError.message };
  }

  const bucketExists = buckets.some((bucket) => bucket.name === defaultBucketName);
  if (!bucketExists) {
    const { error: createError } = await client.storage.createBucket(defaultBucketName, {
      public: true,
      fileSizeLimit: "5MB"
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      return { ok: false as const, message: createError.message };
    }
  }

  return { ok: true as const, client };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "同期コードを入力してから写真共有を使ってください。" }, { status: 401 });
  }

  const prepared = await ensureBucket();
  if (!prepared.ok) {
    return NextResponse.json({ message: prepared.message }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "写真ファイルが見つかりませんでした。" }, { status: 400 });
  }

  const safeFolder = folder === "profile" ? "profile" : "records";
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const filePath = `${safeFolder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error } = await prepared.client.storage.from(defaultBucketName).upload(filePath, fileBuffer, {
    contentType: file.type || "image/jpeg",
    upsert: false
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data } = prepared.client.storage.from(defaultBucketName).getPublicUrl(filePath);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
