import { NextResponse } from "next/server";
import { albumBucket, albumErrorMessage, getAlbumServer } from "@/lib/album/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const server = getAlbumServer(request);
  if (!server.ok) return NextResponse.json({ message: server.message }, { status: server.status });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: "写真を指定してください。" }, { status: 400 });

  try {
    const { data, error } = await server.client
      .from("album_photos")
      .select("storage_path,taken_on")
      .eq("workspace_id", server.workspaceId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "写真が見つかりません。" }, { status: 404 });
    const photo = await server.client.storage.from(albumBucket).download(data.storage_path);
    if (photo.error) throw photo.error;
    return new NextResponse(photo.data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="leon-${data.taken_on}-${id}.jpg"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return NextResponse.json({ message: albumErrorMessage(error) }, { status: 500 });
  }
}
