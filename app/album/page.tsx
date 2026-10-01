"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useAppData } from "@/components/app-provider";
import { prepareAlbumPhoto } from "@/lib/album/image";
import { getTodayDateString } from "@/lib/utils";

type AlbumPhoto = {
  id: string;
  date: string;
  caption: string;
  favorite: boolean;
  bytes: number;
  createdAt: string;
  url: string;
  thumbnailUrl: string;
};

type GalleryPhoto = AlbumPhoto & { source: "album" | "record"; recordId?: string };

function monthLabel(date: string) {
  const [year, month] = date.split("-");
  return `${year}年${Number(month)}月`;
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  return body?.message ?? "通信に失敗しました。";
}

export default function AlbumPage() {
  const { data, isReady, storageMode } = useAppData();
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftPreview, setDraftPreview] = useState("");
  const [draftDate, setDraftDate] = useState(getTodayDateString);
  const [draftCaption, setDraftCaption] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const loadVersion = useRef(0);

  async function loadPhotos(page = 0) {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/album?page=${page}&favorite=${favoriteOnly ? "1" : "0"}`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const result = await response.json() as { photos: AlbumPhoto[]; total: number; nextPage: number | null };
      if (version !== loadVersion.current) return;
      setPhotos((current) => page === 0 ? result.photos : [...current, ...result.photos]);
      setTotal(result.total);
      setNextPage(result.nextPage);
    } catch (cause) {
      if (version === loadVersion.current) setError(cause instanceof Error ? cause.message : "写真の読み込みに失敗しました。");
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (isReady) void loadPhotos();
  }, [isReady, storageMode, favoriteOnly]);

  useEffect(() => () => {
    if (draftPreview) URL.revokeObjectURL(draftPreview);
  }, [draftPreview]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (draftFile && !busy) closeDraft();
        else setSelected(null);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [draftFile, busy]);

  const recordPhotos: GalleryPhoto[] = data.records
    .filter((record) => Boolean(record.photoUrl))
    .map((record) => ({
      id: `record-${record.id}`,
      date: record.date,
      caption: record.memo,
      favorite: false,
      bytes: 0,
      createdAt: record.createdAt,
      url: record.photoUrl,
      thumbnailUrl: record.photoUrl,
      source: "record",
      recordId: record.id
    }));
  const gallery: GalleryPhoto[] = [
    ...photos.map((photo) => ({ ...photo, source: "album" as const })),
    ...recordPhotos
  ]
    .filter((photo) => !favoriteOnly || photo.favorite)
    .sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt));
  const months = Array.from(new Set(gallery.map((photo) => photo.date.slice(0, 7))));

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("20MB以下の写真を選んでください。");
      return;
    }
    setError("");
    setDraftFile(file);
    setDraftPreview(URL.createObjectURL(file));
    setDraftDate(getTodayDateString());
    setDraftCaption("");
  }

  function closeDraft() {
    setDraftFile(null);
    setDraftPreview("");
  }

  async function savePhoto() {
    if (!draftFile || busy) return;
    setBusy(true);
    setError("");
    try {
      const files = await prepareAlbumPhoto(draftFile);
      const form = new FormData();
      form.append("photo", files.photo);
      form.append("thumbnail", files.thumbnail);
      form.append("date", draftDate);
      form.append("caption", draftCaption);
      const response = await fetch("/api/album", { method: "POST", body: form, credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseMessage(response));
      closeDraft();
      setMessage("写真をアルバムに保存しました。");
      if (favoriteOnly) setFavoriteOnly(false);
      else await loadPhotos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "写真を保存できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite(photo: GalleryPhoto) {
    if (photo.source !== "album" || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/album", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id, favorite: !photo.favorite })
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, favorite: !photo.favorite } : item));
      setSelected((current) => current?.id === photo.id ? { ...current, favorite: !photo.favorite } : current);
      if (favoriteOnly) await loadPhotos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "お気に入りを変更できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function deletePhoto(photo: GalleryPhoto) {
    if (photo.source !== "album" || busy || !window.confirm("この写真をアルバムから完全に削除します。元に戻せません。先に写真を保存しましたか？")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/album?id=${encodeURIComponent(photo.id)}`, { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseMessage(response));
      setSelected(null);
      setMessage("写真を削除しました。");
      await loadPhotos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "写真を削除できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-5 py-7 shadow-card sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">LEON / MEMORIES</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">アルバム</h2>
            <p className="mt-3 text-sm text-ink/60 sm:text-base">レオンとの毎日を、写真で残す。</p>
          </div>
          <button type="button" className="button-primary gap-3 px-6 py-4" onClick={() => fileInput.current?.click()}>
            <span className="text-xl leading-none" aria-hidden="true">＋</span>今日の1枚を追加
          </button>
        </div>
      </section>

      <input ref={fileInput} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={chooseFile} aria-label="アルバムに写真を追加" />

      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/60">{total + (favoriteOnly ? 0 : recordPhotos.length)}枚の思い出</p>
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 p-1 ring-1 ring-line">
          <button type="button" className={`rounded-xl px-4 py-2 text-sm font-semibold ${!favoriteOnly ? "bg-indigo-600 text-white" : "text-ink/60"}`} onClick={() => setFavoriteOnly(false)}>すべて</button>
          <button type="button" className={`rounded-xl px-4 py-2 text-sm font-semibold ${favoriteOnly ? "bg-indigo-600 text-white" : "text-ink/60"}`} onClick={() => setFavoriteOnly(true)}>♡ お気に入り</button>
        </div>
      </section>

      {message ? <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <div role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}<button type="button" className="ml-3 underline" onClick={() => void loadPhotos()}>再読み込み</button></div> : null}
      {storageMode === "local" ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">この端末の記録写真は見られます。新しい写真を家族で共有するには、プロフィール画面でクラウド同期に接続してください。</p> : null}
      {loading && gallery.length === 0 ? <p role="status" className="card px-5 py-8 text-center text-sm text-ink/55">写真を読み込んでいます...</p> : null}

      {gallery.length === 0 && !loading ? (
        <section className="card px-6 py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-50 text-3xl text-indigo-600" aria-hidden="true">▧</div>
          <h3 className="mt-5 text-xl font-bold">{favoriteOnly ? "お気に入りはまだありません" : "最初の1枚を残しましょう"}</h3>
          <p className="mt-2 text-sm text-ink/55">{favoriteOnly ? "写真のハートを押すとここに表示されます。" : "体重記録に添えた写真も、ここに並びます。"}</p>
        </section>
      ) : null}

      {months.map((month) => {
        const items = gallery.filter((photo) => photo.date.startsWith(month));
        return (
          <section key={month} className="space-y-4">
            <div className="flex items-baseline gap-3 border-b border-sand/70 pb-3">
              <h3 className="text-2xl font-bold tracking-tight">{monthLabel(`${month}-01`)}</h3>
              <span className="text-sm font-medium text-ink/45">{items.length}枚</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((photo) => (
                <article key={photo.id} className="group relative overflow-hidden rounded-[1.35rem] bg-white shadow-card ring-1 ring-white">
                  <button type="button" className="block w-full text-left" onClick={() => setSelected(photo)} aria-label={`${photo.date}の写真を開く`}>
                    <img src={photo.thumbnailUrl} alt={photo.caption || `${photo.date}のレオン`} loading="lazy" className="aspect-[4/5] w-full bg-sand/30 object-cover transition duration-300 group-hover:scale-[1.03] sm:aspect-square" />
                    <div className="relative space-y-1 px-3 py-3">
                      <p className="text-xs font-semibold text-ink/45">{photo.date.replaceAll("-", ".")}</p>
                      <p className="truncate text-sm font-semibold">{photo.caption || (photo.source === "record" ? "成長記録の写真" : "今日のレオン")}</p>
                    </div>
                  </button>
                  {photo.source === "album" ? (
                    <button type="button" onClick={() => void toggleFavorite(photo)} aria-label={photo.favorite ? "お気に入りから外す" : "お気に入りに追加"} aria-pressed={photo.favorite} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-xl shadow-md ${photo.favorite ? "text-rose-500" : "text-ink/55"}`}>
                      {photo.favorite ? "♥" : "♡"}
                    </button>
                  ) : <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-ink/70">記録から</span>}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {nextPage !== null ? <button type="button" className="button-secondary w-full" disabled={loading} onClick={() => void loadPhotos(nextPage)}>{loading ? "読み込み中..." : "さらに写真を見る"}</button> : null}
      <p className="text-xs leading-5 text-ink/45">記録から表示している写真は、元の公開設定のままです。新しく追加した写真は非公開で保存します。</p>

      {draftFile ? (
        <div role="dialog" aria-modal="true" aria-label="写真を追加" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-bold">今日の1枚を残す</h3><button type="button" className="text-2xl text-ink/50" onClick={closeDraft} aria-label="閉じる">×</button></div>
            <img src={draftPreview} alt="追加する写真のプレビュー" className="mt-4 max-h-64 w-full rounded-2xl bg-sand/20 object-contain" />
            <label className="mt-5 block"><span className="label">撮影日</span><input className="input" type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} /></label>
            <label className="mt-4 block"><span className="label">ひとこと（任意）</span><input className="input" maxLength={200} value={draftCaption} onChange={(event) => setDraftCaption(event.target.value)} placeholder="例：公園でたくさん走った日" /></label>
            {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p> : null}
            <p className="mt-4 text-xs leading-5 text-ink/50">写真は容量を抑えて保存します。元の高画質写真は端末にも残してください。</p>
            <div className="mt-5 flex gap-3"><button type="button" className="button-secondary flex-1" onClick={closeDraft}>キャンセル</button><button type="button" className="button-primary flex-1" disabled={busy || !draftDate} onClick={() => void savePhoto()}>{busy ? "保存中..." : "アルバムに保存"}</button></div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div role="dialog" aria-modal="true" aria-label="写真の詳細" className="fixed inset-0 z-40 flex items-center justify-center bg-ink/85 p-3 sm:p-6" onClick={() => setSelected(null)}>
          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] bg-white p-3 shadow-2xl sm:p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-4 px-2"><p className="text-sm font-semibold">{selected.date.replaceAll("-", ".")}</p><button type="button" className="text-2xl text-ink/60" aria-label="閉じる" onClick={() => setSelected(null)}>×</button></div>
            <img src={selected.url} alt={selected.caption || "レオンの写真"} className="max-h-[65vh] w-full rounded-2xl bg-sand/20 object-contain" />
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4"><p className="text-sm leading-6">{selected.caption || "レオンとの思い出"}</p><div className="flex gap-2">{selected.source === "album" ? <><a className="button-secondary px-4 py-2" href={`/api/album/download?id=${selected.id}`}>写真を保存</a><button type="button" className="rounded-2xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50" disabled={busy} onClick={() => void deletePhoto(selected)}>削除</button></> : <Link className="button-secondary px-4 py-2" href={`/records/${selected.recordId}/edit`}>記録を見る</Link>}</div></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
