import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Never read or decode an uploaded body, including requests from old clients.
  return NextResponse.json({ message: "写真変換は端末内の処理に変わりました。アプリを開き直してください。" }, {
    status: 410, headers: { "Cache-Control": "no-store" }
  });
}
