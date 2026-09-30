"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppData } from "@/components/app-provider";
import { filters, genres, type Favorite, type Filter, type Genre, type OutingsStatus, type Place, type SearchResult } from "@/lib/addons/outings/types";
import { parseBackup, parseFavorite, safeUrl } from "@/lib/addons/outings/validation";

const endpoint = "/api/addons/outings";
const lastScopeKey = "leon-outings-last-scope";
const cacheKey = (scope: string) => `leon-outings-favorites-v1:${scope}`;
const initialStatus: OutingsStatus = { enabled: false, authenticated: false, ready: false, storageReady: false, message: "利用状況を確認しています。" };
const dateLabel = (date: string) => new Date(date).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

function Icon({ name, className = "h-5 w-5" }: { name: "pin" | "search" | "heart" | "arrow" | "tree"; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "pin" ? <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> :
      name === "search" ? <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></> :
      name === "heart" ? <path d="M20.5 4.8a5.5 5.5 0 0 0-8.5.7 5.5 5.5 0 0 0-8.5-.7c-5 5 2 10.5 8.5 15.2 6.5-4.7 13.5-10.2 8.5-15.2Z" /> :
      name === "arrow" ? <><path d="M7 17 19 5M7 5h12v12" /></> :
        <><path d="M8 22V10m0 6C-1 16 1 7 5 6 2 0 15 0 12 6c7 2 7 11-4 10Zm10 6v-9m-3 4h7m-7-4 3-4 4 4" /></>}
  </svg>;
}

function LinkButton({ url, children }: { url: string; children: React.ReactNode }) {
  const safe = safeUrl(url);
  return safe ? <a href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">{children}<Icon name="arrow" className="h-4 w-4" /></a> : null;
}

function FavoriteCard({ favorite, disabled, onUpdate, onRemove }: { favorite: Favorite; disabled: boolean; onUpdate: (favorite: Favorite) => void; onRemove: (id: string) => void }) {
  const [memo, setMemo] = useState(favorite.memo);
  useEffect(() => setMemo(favorite.memo), [favorite.memo]);
  return <article className="rounded-2xl border border-line bg-white p-5 shadow-sm">
    <div className="flex gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand/30 text-ink/65"><Icon name="pin" className="h-6 w-6" /></span><div className="min-w-0"><h3 className="break-words font-bold">{favorite.name}</h3><p className="mt-1 text-sm text-ink/60">{favorite.genre} / {favorite.area}</p></div></div>
    <label className="mt-4 block text-sm"><span className="mb-2 block font-medium">メモ</span><textarea className="input resize-y !text-base" maxLength={500} rows={2} value={memo} onChange={e => setMemo(e.target.value)} placeholder="次の週末に行ってみたい" disabled={disabled} /></label>
    {memo !== favorite.memo && <button type="button" className="button-secondary mt-2 min-h-11" disabled={disabled} onClick={() => onUpdate({ ...favorite, memo })}>メモを保存</button>}
    <p className="mt-3 break-all text-xs text-ink/55">参照サイト：{new URL(favorite.url).hostname}</p>
    <p className="mt-2 text-xs leading-5 text-ink/55">検索日：{dateLabel(favorite.searchedAt)} / 保存日：{dateLabel(favorite.savedAt)}<br />最新の利用条件はサイトでご確認ください。</p>
    <div className="mt-4 grid grid-cols-2 gap-2"><LinkButton url={favorite.url}>サイトを見る</LinkButton><button type="button" disabled={disabled} onClick={() => { if (window.confirm(`「${favorite.name}」を行きたい一覧から外しますか？`)) onRemove(favorite.id); }} className="button-secondary min-h-11 disabled:opacity-40">保存を解除</button></div>
  </article>;
}

function PlaceCard({ place, searchGenre, saved, disabled, onSave }: { place: Place; searchGenre: Genre; saved: boolean; disabled: boolean; onSave: () => void }) {
  return <article className="rounded-2xl border border-line bg-white p-5 shadow-sm">
    <div className="flex gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand/30 text-ink/65"><Icon name="tree" className="h-7 w-7" /></span><div className="min-w-0"><h3 className="break-words text-lg font-bold">{place.name}</h3><p className="mt-1 text-sm text-ink/60">{place.genre} / {place.area}</p></div></div>
    {searchGenre !== "すべて" && place.genre !== searchGenre && <p className="mt-3 text-xs font-medium text-amber-800">指定したジャンルとは異なる候補です。</p>}
    <p className="mt-3 text-sm leading-6 text-ink/80">{place.description}</p><p className="mt-2 text-sm leading-6 text-ink/65">{place.dogPolicy}</p>
    <div className="mt-3 flex flex-wrap gap-2">{place.conditions.map(c => <span key={c.label} title={c.detail} className={`rounded-full px-3 py-1 text-xs font-medium ${c.status === "yes" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-800"}`}>{c.label}：{c.status === "yes" ? "対応情報あり" : "要確認"}</span>)}</div>
    <div className="mt-3 space-y-1 text-xs text-ink/60">{place.sources.map((source, i) => <a key={source.url} className="block break-words py-1 underline underline-offset-2" href={source.url} target="_blank" rel="noopener noreferrer">出典 {i + 1}：{source.title}</a>)}</div>
    <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><LinkButton url={place.sources[0].url}>サイトを見る</LinkButton><button type="button" disabled={disabled || saved} onClick={onSave} className="button-secondary min-h-11 gap-2 disabled:opacity-45"><Icon name="heart" />{saved ? "保存済み" : "保存"}</button></div>
  </article>;
}

export function OutingsManager() {
  const { data } = useAppData();
  const [tab, setTab] = useState<"search" | "saved">("search");
  const [area, setArea] = useState(""); const [genre, setGenre] = useState<Genre>("すべて");
  const [selected, setSelected] = useState<Filter[]>([]); const [note, setNote] = useState("");
  const [status, setStatus] = useState(initialStatus); const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false); const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false); const [cached, setCached] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]); const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [passcode, setPasscode] = useState(""); const [showPasscode, setShowPasscode] = useState(false);
  const operation = useRef(false); const cacheScope = useRef("");

  function remember(items: Favorite[], scope: string) {
    if (!scope) return;
    try { localStorage.setItem(cacheKey(scope), JSON.stringify(items)); localStorage.setItem(lastScopeKey, scope); }
    catch { setNotice("共有保存は完了しましたが、この端末の閲覧用コピーは保存できませんでした。"); }
  }
  function readCache(scope: string) {
    try {
      const raw = JSON.parse(localStorage.getItem(cacheKey(scope)) || "[]");
      if (!Array.isArray(raw)) return;
      const valid = raw.slice(0, 200).flatMap(item => {
        try { const parsed = parseFavorite(item); return typeof item.id === "string" && Number.isFinite(Date.parse(item.savedAt)) ? [{ ...parsed, id: item.id, savedAt: item.savedAt }] : []; }
        catch { return []; }
      });
      setFavorites(valid); setCached(valid.length > 0);
    } catch { /* A damaged cache must not prevent online recovery. */ }
  }
  async function request(path: string, options?: RequestInit) {
    const response = await fetch(`${endpoint}/${path}`, { ...options, cache: "no-store", signal: AbortSignal.timeout(path === "search" ? 55000 : 25000), headers: { "Content-Type": "application/json", ...options?.headers } });
    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 401) setStatus(s => ({ ...s, authenticated: false, ready: false, storageReady: false }));
      throw new Error(payload.message || "処理に失敗しました。");
    }
    return payload;
  }
  async function refresh() {
    setLoading(true);
    try {
      const next: OutingsStatus = await request("status"); setStatus(next);
      if (!next.authenticated) { setFavorites([]); setCached(false); cacheScope.current = ""; return; }
      if (next.cacheScope) {
        if (cacheScope.current !== next.cacheScope) { setFavorites([]); setCached(false); }
        cacheScope.current = next.cacheScope; readCache(next.cacheScope);
      }
      if (next.storageReady) { const payload = await request("favorites"); setFavorites(payload.favorites); setCached(false); remember(payload.favorites, cacheScope.current); }
    } catch {
      setStatus(s => ({ ...s, ready: false, storageReady: false }));
      setCached(true);
      setError("接続を確認できません。保存済みの場所は端末のコピーを表示します。");
    }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    try { const scope = localStorage.getItem(lastScopeKey); if (scope) readCache(scope); } catch { /* No cache available. */ }
    void refresh();
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
    // This is an initial load. Later refreshes are explicit, never paid automatic searches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault(); if (operation.current) return;
    operation.current = true; setSearching(true); setError(""); setNotice("");
    try { setResult(await request("search", { method: "POST", body: JSON.stringify({ area, genre, filters: selected, note, requestId: crypto.randomUUID() }) })); }
    catch (e) { setError(e instanceof Error ? e.message : "検索に失敗しました。"); }
    finally { setSearching(false); operation.current = false; await refresh(); }
  }
  async function mutate(method: "POST" | "DELETE", payload: unknown) {
    if (operation.current) return;
    operation.current = true; setSaving(true); setError(""); setNotice("");
    try { const response = await request("favorites", { method, body: JSON.stringify(payload) }); setFavorites(response.favorites); setCached(false); remember(response.favorites, cacheScope.current); setNotice(method === "DELETE" ? "保存を解除しました。" : "行きたい場所を保存しました。"); }
    catch (e) { setError(e instanceof Error ? e.message : "保存に失敗しました。"); }
    finally { operation.current = false; setSaving(false); }
  }
  async function unlock(event: FormEvent) {
    event.preventDefault(); if (operation.current) return;
    operation.current = true; setSaving(true); setError("");
    try {
      const response = await fetch("/api/snapshot/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error((await response.json()).message || "同期コードを確認してください。");
      setPasscode(""); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "接続できませんでした。"); }
    finally { operation.current = false; setSaving(false); }
  }
  function exportFavorites() {
    const blob = new Blob([JSON.stringify({ app: "leon-outings", version: 1, favorites }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `leon-outings-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const disabled = !status.storageReady || !status.authenticated || offline || loading || saving || searching;
  const groups = result ? [{ title: "おすすめの場所", items: result.places.filter(p => !p.needsCheck) }, { title: "条件を確認したい候補", items: result.places.filter(p => p.needsCheck) }] : [];

  return <div className="mx-auto max-w-5xl space-y-5">
    <header className="flex items-center justify-between gap-4 px-1 py-2"><div><p className="text-xs font-semibold tracking-[0.16em] text-indigo-600">LEON / OUTINGS</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">おでかけ</h2><p className="mt-2 text-sm font-medium text-ink/70">{data.profile.name || "レオン"}と、どこ行こう？</p></div><img src={data.profile.photoUrl || "/placeholder-dog.svg"} alt="" className="h-20 w-20 rounded-full bg-white object-cover ring-4 ring-white sm:h-24 sm:w-24" /></header>
    <div role="tablist" aria-label="おでかけの表示" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-1.5">{([ ["search", "探す"], ["saved", "行きたい"] ] as const).map(([value, label]) => <button key={value} id={`outings-tab-${value}`} role="tab" tabIndex={tab === value ? 0 : -1} aria-selected={tab === value} aria-controls={`outings-panel-${value}`} type="button" onClick={() => setTab(value)} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? "search" : event.key === "End" ? "saved" : value === "search" ? "saved" : "search";
      setTab(next); document.getElementById(`outings-tab-${next}`)?.focus();
    }} className={`min-h-12 rounded-xl font-semibold transition ${tab === value ? "bg-indigo-600 text-white shadow-sm" : "text-ink/65 hover:bg-indigo-50"}`}>{label}{value === "saved" && favorites.length > 0 ? ` (${favorites.length})` : ""}</button>)}</div>
    <div className="space-y-2" aria-live="polite">{error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</p>}{notice && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}{offline && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">オフラインです。保存済みの場所を閲覧できます。</p>}</div>
    {(loading || status.message) && <section className="rounded-2xl border border-line bg-white/70 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm leading-6 text-ink/65">{loading ? "利用状況を確認しています。" : status.message}</p><button type="button" className="min-h-11 shrink-0 px-3 text-sm font-semibold text-indigo-700 disabled:opacity-40" disabled={loading || searching || saving || offline} onClick={() => { setError(""); void refresh(); }}>再確認</button></div>
      {!loading && !status.authenticated && !offline && <form onSubmit={unlock} className="mt-3 space-y-3"><label className="label" htmlFor="outings-passcode">家族の同期コード</label><div className="flex gap-2"><input id="outings-passcode" className="input !text-base" type={showPasscode ? "text" : "password"} autoComplete="current-password" maxLength={256} value={passcode} onChange={e => setPasscode(e.target.value)} required /><button type="button" aria-pressed={showPasscode} className="button-secondary min-h-11 shrink-0" onClick={() => setShowPasscode(!showPasscode)}>{showPasscode ? "隠す" : "表示"}</button></div><button className="button-primary min-h-11 disabled:opacity-40" disabled={saving || !passcode.trim()}>おでかけを利用する</button><p className="text-xs text-ink/55">いつもの家族共有コードで利用できます。</p></form>}
    </section>}

    {tab === "search" ? <section role="tabpanel" id="outings-panel-search" aria-labelledby="outings-tab-search" className="space-y-5">
      <form onSubmit={search} className="card space-y-5 p-5 sm:p-6"><div><label htmlFor="outings-area" className="label">エリア</label><div className="relative"><span className="pointer-events-none absolute left-4 top-3.5 text-ink/55"><Icon name="pin" /></span><input id="outings-area" className="input !pl-12 !text-base" placeholder="例：横浜市周辺、軽井沢" value={area} onChange={e => setArea(e.target.value)} maxLength={100} required /></div></div>
        <fieldset><legend className="label">ジャンル</legend><div className="flex flex-wrap gap-2">{genres.map(item => <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${genre === item ? "border-indigo-600 bg-indigo-600 text-white" : "border-line bg-white text-ink/70 hover:border-indigo-300"}`}>{item}</button>)}</div></fieldset>
        <fieldset><legend className="label">こだわり条件 <span className="font-normal text-ink/50">複数選択できます</span></legend><div className="flex flex-wrap gap-2">{filters.map(item => <button key={item} type="button" aria-pressed={selected.includes(item)} onClick={() => setSelected(current => current.includes(item) ? current.filter(f => f !== item) : [...current, item])} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium ${selected.includes(item) ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-line bg-white text-ink/65"}`}>{selected.includes(item) ? "✓ " : ""}{item}</button>)}</div></fieldset>
        <div><label htmlFor="outings-note" className="label">希望をひとこと <span className="font-normal text-ink/50">任意</span></label><input id="outings-note" className="input !text-base" placeholder="例：のんびり過ごせる場所がいいです" maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></div>
        <button disabled={!status.ready || disabled || !area.trim()} className="button-primary min-h-12 w-full gap-2 !text-base disabled:cursor-not-allowed disabled:opacity-40"><Icon name="search" />{searching ? "おでかけ先を探しています…" : "AIで探す"}</button>
        <p className="text-center text-xs leading-5 text-ink/55">検索ボタンを押したときだけAIを利用し、検索ごとにAPI料金が発生する場合があります。<br />地域・条件・希望文をOpenAIに送信します。個人情報は入力しないでください。</p>
      </form>
      {searching && <div role="status" className="card p-6 text-center text-sm text-ink/65">条件に合う場所と参照サイトを探しています。<br />少し時間がかかる場合があります。</div>}
      {result ? <div className="space-y-5"><p className="text-xs leading-6 text-ink/60">検索条件：{result.query.area} / {result.query.genre} / {result.query.filters.join("・") || "条件指定なし"}{result.query.note && ` / ${result.query.note}`}<br />検索日時：{dateLabel(result.searchedAt)}。条件を変更したら「AIで探す」で再検索できます。</p>
        {result.places.length === 0 && <div className="card p-7 text-center"><p className="font-semibold">出典を確認できる候補が見つかりませんでした</p><p className="mt-2 text-sm text-ink/60">AIが候補を挙げなかったか、候補の出典を照合できませんでした。地域や希望を変えてお試しください。</p></div>}
        {groups.filter(group => group.items.length > 0).map(group => <section key={group.title}><h3 className="mb-3 flex items-center gap-3 text-lg font-bold">{group.title}<span className="text-sm font-normal text-ink/55">{group.items.length}件</span></h3><div className="grid gap-4 lg:grid-cols-2">{group.items.map(place => <PlaceCard key={place.name + place.sources[0].url} place={place} searchGenre={result.query.genre} disabled={disabled} saved={favorites.some(f => f.url === place.sources[0].url)} onSave={() => void mutate("POST", { favorite: { name: place.name, area: place.area, genre: place.genre, url: place.sources[0].url, memo: "", searchedAt: place.searchedAt } })} />)}</div></section>)}
        <p className="text-xs leading-6 text-ink/55">AI検索の結果です。犬のサイズ制限・予約・証明書などの最新条件は、リンク先の施設情報でご確認ください。</p>
      </div> : !searching && <div className="rounded-3xl border border-dashed border-sand p-8 text-center"><Icon name="tree" className="mx-auto h-9 w-9 text-indigo-400" /><p className="mt-4 font-semibold">次のおでかけを見つけよう</p><p className="mt-2 text-sm leading-6 text-ink/55">地域と好きな過ごし方を選ぶと、<br />参照サイト付きで候補を提案します。</p></div>}
    </section> : <section role="tabpanel" id="outings-panel-saved" aria-labelledby="outings-tab-saved" className="space-y-4"><div><h3 className="text-lg font-bold">気になる場所を、次のおでかけに。</h3><p className="mt-2 text-sm text-ink/60">保存した場所 {favorites.length}件{cached ? " / この端末の閲覧用コピー" : ""}</p></div>
      {favorites.length ? <div className="grid gap-4 lg:grid-cols-2">{favorites.map(favorite => <FavoriteCard key={favorite.id} favorite={favorite} disabled={disabled || cached} onUpdate={favorite => void mutate("POST", { favorite })} onRemove={id => void mutate("DELETE", { id })} />)}</div> : <div className="card p-8 text-center"><Icon name="heart" className="mx-auto h-9 w-9 text-indigo-300" /><p className="mt-4 font-semibold">行きたい場所を集めよう</p><p className="mt-2 text-sm text-ink/55">検索結果の「保存」から追加できます。</p><button type="button" className="button-secondary mt-5 min-h-11" onClick={() => setTab("search")}>場所を探す</button></div>}
      <details className="rounded-2xl border border-line bg-white/70 p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">おでかけのバックアップ</summary><p className="my-3 text-xs leading-6 text-ink/60">行きたい場所は、日々の記録とは別のファイルに保存します。復元は追加・更新のみで、一覧全体を消しません。同じURLのメモは復元内容に更新されます。</p><div className="flex flex-wrap gap-3"><button type="button" className="button-secondary min-h-11 disabled:opacity-40" disabled={!favorites.length} onClick={exportFavorites}>JSONを書き出す</button><label className={`button-secondary min-h-11 ${disabled ? "opacity-40" : "cursor-pointer"}`}>JSONから復元<input className="sr-only" type="file" accept=".json,application/json" disabled={disabled} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
        try { if (file.size > 1500000) throw new Error("1.5MB以下のバックアップを選んでください。"); const raw = JSON.parse(await file.text()); parseBackup(raw); if (window.confirm("行きたい場所を追加・更新します。同じURLのメモはバックアップの内容になります。よろしいですか？")) await mutate("POST", { backup: raw }); }
        catch (e) { setError(e instanceof Error ? e.message : "復元できませんでした。"); }
      }} /></label></div></details>
    </section>}
  </div>;
}
