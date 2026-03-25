import { NextResponse } from "next/server";
import heicConvert from "heic-convert";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "ファイルが見つかりません。" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.85
    });

    const dataUrl = `data:image/jpeg;base64,${outputBuffer.toString("base64")}`;
    const fileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

    return NextResponse.json({
      dataUrl,
      fileName
    });
  } catch (error) {
    console.error("HEIC変換に失敗しました", error);
    return NextResponse.json(
      { message: "HEIC画像の変換に失敗しました。" },
      { status: 500 }
    );
  }
}
