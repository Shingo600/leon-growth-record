import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { albumBucket, albumErrorMessage, ensurePrivateAlbumBucket, getAlbumServer, type AlbumRow } from "@/lib/album/server";

export const runtime = "nodejs";
const pageSize = 30;

function failure(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function signedPhoto(client: ReturnType<typeof getAlbumServer> & { ok: true }, row: AlbumRow) {
  const [photo, thumbnail] = await Promise.all([
    client.client.storage.from(albumBucket).createSignedUrl(row.storage_path, 3600),
    client.client.storage.from(albumBucket).createSignedUrl(row.thumbnail_path, 3600)
  ]);
  if (photo.error || thumbnail.error) throw photo.error ?? thumbnail.error;
  return {
    id: row.id,
    date: row.taken_on,
    caption: row.caption,
    favorite: row.favorite,
    bytes: row.byte_size,
    createdAt: row.created_at,
    url: photo.data.signedUrl,
    thumbnailUrl: thumbnail.data.signedUrl
  };
}

export async function GET(request: Request) {
  const server = getAlbumServer(request);
  if (!server.ok) return failure(server.message, server.status);

  const pageValue = Number(new URL(request.url).searchParams.get("page") ?? "0");
  const favoriteOnly = new URL(request.url).searchParams.get("favorite") === "1";
  if (!Number.isInteger(pageValue) || pageValue < 0 || pageValue > 10000) return failure("ページ指定が不正です。", 400);

  try {
    let query = server.client
      .from("album_photos")
      .select("*", { count: "exact" })
      .eq("workspace_id", server.workspaceId);
    if (favoriteOnly) query = query.eq("favorite", true);
    const { data, error, count } = await query
      .order("taken_on", { ascending: false })
      .order("created_at", { ascending: false })
      .range(pageValue * pageSize, (pageValue + 1) * pageSize - 1);
    if (error) throw error;
    const rows = data as AlbumRow[];
    const paths = rows.flatMap((row) => [row.storage_path, row.thumbnail_path]);
    const signed = paths.length > 0
      ? await server.client.storage.from(albumBucket).createSignedUrls(paths, 3600)
      : { data: [], error: null };
    if (signed.error) throw signed.error;
    const urls = new Map(signed.data.map((item) => [item.path, item]));
    const photos = rows.map((row) => {
      const photo = urls.get(row.storage_path);
      const thumbnail = urls.get(row.thumbnail_path);
      if (!photo?.signedUrl || !thumbnail?.signedUrl || photo.error || thumbnail.error) {
        throw new Error("写真のURLを発行できませんでした。時間をおいて再読み込みしてください。");
      }
      return {
        id: row.id,
        date: row.taken_on,
        caption: row.caption,
        favorite: row.favorite,
        bytes: row.byte_size,
        createdAt: row.created_at,
        url: photo.signedUrl,
        thumbnailUrl: thumbnail.signedUrl
      };
    });
    return NextResponse.json({ photos, total: count ?? photos.length, nextPage: (pageValue + 1) * pageSize < (count ?? 0) ? pageValue + 1 : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return failure(albumErrorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  const server = getAlbumServer(request);
  if (!server.ok) return failure(server.message, server.status);

  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  const thumbnail = form?.get("thumbnail");
  const date = form?.get("date");
  const caption = form?.get("caption");
  if (!(photo instanceof File) || !(thumbnail instanceof File) || typeof date !== "string" || typeof caption !== "string") {
    return failure("写真の入力を確認してください。", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || caption.length > 200) {
    return failure("日付またはコメントを確認してください。", 400);
  }
  if (photo.size === 0 || thumbnail.size === 0 || photo.size > 2 * 1024 * 1024 || thumbnail.size > 300 * 1024) {
    return failure("写真が大きすぎます。別の写真を選んでください。", 400);
  }
  const [photoBuffer, thumbBuffer] = await Promise.all([photo.arrayBuffer(), thumbnail.arrayBuffer()]);
  if (![photoBuffer, thumbBuffer].every((buffer) => {
    const bytes = new Uint8Array(buffer);
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  })) return failure("JPEG写真を選んでください。", 400);

  const id = randomUUID();
  const storagePath = `photos/${id}/image.jpg`;
  const thumbnailPath = `photos/${id}/thumbnail.jpg`;
  const storage = server.client.storage.from(albumBucket);
  try {
    await ensurePrivateAlbumBucket(server.client);
    const first = await storage.upload(storagePath, photoBuffer, { contentType: "image/jpeg", upsert: false });
    if (first.error) throw first.error;
    const second = await storage.upload(thumbnailPath, thumbBuffer, { contentType: "image/jpeg", upsert: false });
    if (second.error) throw second.error;
    const row: AlbumRow = {
      id,
      workspace_id: server.workspaceId,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      taken_on: date,
      caption: caption.trim(),
      favorite: false,
      byte_size: photo.size + thumbnail.size,
      created_at: new Date().toISOString()
    };
    const signed = await signedPhoto(server, row);
    const result = await server.client.from("album_photos").insert(row);
    if (result.error) throw result.error;
    return NextResponse.json({ photo: signed }, { status: 201 });
  } catch (error) {
    await storage.remove([storagePath, thumbnailPath]).catch(() => null);
    return failure(albumErrorMessage(error), 500);
  }
}

export async function PATCH(request: Request) {
  const server = getAlbumServer(request);
  if (!server.ok) return failure(server.message, server.status);
  const body = await request.json().catch(() => null) as { id?: unknown; favorite?: unknown; caption?: unknown } | null;
  if (!body || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return failure("写真を指定してください。", 400);
  const changes: { favorite?: boolean; caption?: string } = {};
  if (typeof body.favorite === "boolean") changes.favorite = body.favorite;
  if (typeof body.caption === "string" && body.caption.length <= 200) changes.caption = body.caption.trim();
  if (Object.keys(changes).length === 0) return failure("変更内容がありません。", 400);
  const { error } = await server.client.from("album_photos").update(changes).eq("workspace_id", server.workspaceId).eq("id", body.id);
  return error ? failure(albumErrorMessage(error), 500) : NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const server = getAlbumServer(request);
  if (!server.ok) return failure(server.message, server.status);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return failure("写真を指定してください。", 400);

  try {
    const { data, error } = await server.client
      .from("album_photos")
      .select("storage_path,thumbnail_path")
      .eq("workspace_id", server.workspaceId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return failure("写真が見つかりません。", 404);
    const removed = await server.client.storage.from(albumBucket).remove([data.storage_path, data.thumbnail_path]);
    if (removed.error) throw removed.error;
    const deleted = await server.client.from("album_photos").delete().eq("workspace_id", server.workspaceId).eq("id", id);
    if (deleted.error) throw deleted.error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(albumErrorMessage(error), 500);
  }
}
