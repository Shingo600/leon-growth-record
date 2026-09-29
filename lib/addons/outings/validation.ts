import { filters, genres, type Favorite, type SearchInput } from "./types";

export function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || /[\s\u0000-\u001f]/.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.port ||
      !host.includes(".") || host.endsWith(".") || host.includes(":") || /^\d+(\.\d+)*$/.test(host) ||
      /\.(localhost|local|internal|test|invalid)$/.test(host)) return null;
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^utm_/i.test(key) || ["gclid", "fbclid"].includes(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch { return null; }
}

export function parseSearch(value: unknown): SearchInput {
  const raw = object(value);
  if (typeof raw.area !== "string" || !raw.area.trim() || raw.area.length > 100 ||
    typeof raw.note !== "string" || raw.note.length > 500 ||
    !genres.includes(raw.genre as SearchInput["genre"]) ||
    !Array.isArray(raw.filters) || raw.filters.length > filters.length ||
    raw.filters.some((item) => !filters.includes(item)) ||
    typeof raw.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.requestId)) {
    throw new Error("地域と検索条件を確認してください。");
  }
  return { area: raw.area.trim(), genre: raw.genre as SearchInput["genre"], filters: [...new Set(raw.filters)], note: raw.note.trim(), requestId: raw.requestId };
}

export function parseFavorite(value: unknown): Omit<Favorite, "id" | "savedAt"> {
  const raw = object(value);
  const url = safeUrl(raw.url);
  if (!url || typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 160 ||
    typeof raw.area !== "string" || raw.area.length > 120 || typeof raw.memo !== "string" || raw.memo.length > 500 ||
    !genres.includes(raw.genre as Favorite["genre"]) || typeof raw.searchedAt !== "string" ||
    !Number.isFinite(Date.parse(raw.searchedAt))) throw new Error("保存する場所の情報を確認してください。");
  return { name: raw.name.trim(), area: raw.area.trim(), genre: raw.genre as Favorite["genre"], url, memo: raw.memo.trim(), searchedAt: new Date(raw.searchedAt).toISOString() };
}

export function parseBackup(value: unknown) {
  const raw = object(value);
  if (raw.app !== "leon-outings" || raw.version !== 1 || !Array.isArray(raw.favorites) || raw.favorites.length > 200) {
    throw new Error("おでかけ用のバックアップを選んでください（最大200件）。");
  }
  return raw.favorites.map(parseFavorite);
}
