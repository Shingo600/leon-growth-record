"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { InstallPrompt } from "@/components/install-prompt";
import { NotificationCenter } from "@/components/notification-center";
import { PwaRegister } from "@/components/pwa-register";
import { getAgeText, getUpcomingEvents } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ダッシュボード", shortLabel: "ホーム", icon: "⌂" },
  { href: "/records", label: "体重記録", shortLabel: "記録", icon: "▣" },
  { href: "/meals", label: "ごはん記録", shortLabel: "ごはん", icon: "◉" },
  { href: "/calendar", label: "予定・カレンダー", shortLabel: "予定", icon: "□" },
  { href: "/health", label: "健康記録", shortLabel: "健康", icon: "♡" },
  { href: "/commands", label: "コマンド", shortLabel: "特訓", icon: "✣" },
  { href: "/expenses", label: "費用", shortLabel: "費用", icon: "◇" },
  { href: "/profile", label: "プロフィール", shortLabel: "設定", icon: "○" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, saveError } = useAppData();
  const dogPhoto = data.profile.photoUrl || "/placeholder-dog.svg";
  const nextEvent = getUpcomingEvents(data.events)[0];

  return (
    <div className="min-h-screen px-4 pb-28 pt-4 md:px-6 md:pb-8">
      <PwaRegister />
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-4 hidden items-center justify-between gap-5 md:flex">
          <Link href="/" className="flex items-center gap-3">
            <img src={dogPhoto} alt={`${data.profile.name}の写真`} className="h-14 w-14 rounded-full object-cover ring-4 ring-white" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">レオン成長記録</h1>
              <p className="text-sm font-medium text-ink/55">Leon&apos;s Growth Record</p>
            </div>
          </Link>
          <nav className="flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-line/80 bg-white/80 px-2 py-1.5 shadow-[0_12px_36px_-28px_rgba(47,42,37,0.4)] backdrop-blur">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" : "text-ink/65 hover:bg-sand/30"
                  }`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/profile" className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-ink shadow-[0_12px_36px_-28px_rgba(47,42,37,0.45)] ring-1 ring-line">
            <img src={dogPhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
            レオンの家族
          </Link>
        </header>

        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="card sticky top-5 hidden h-[calc(100vh-2.5rem)] flex-col p-5 md:flex">
            <div className="text-center">
              <img src={dogPhoto} alt={`${data.profile.name}の写真`} className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-indigo-50" />
              <h2 className="mt-4 text-2xl font-bold">{data.profile.name || "レオン"}</h2>
              <p className="mt-1 text-sm text-ink/55">{getAgeText(data.profile.birthday) || data.profile.breed || "プロフィール設定中"}</p>
            </div>
            <nav className="mt-7 space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active ? "bg-indigo-600 text-white shadow-[0_16px_30px_-22px_rgba(79,70,229,0.9)]" : "text-ink/70 hover:bg-sand/35"
                    }`}
                  >
                    <span className="w-5 text-center" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto rounded-3xl bg-indigo-50/80 p-4 ring-1 ring-indigo-100">
              <p className="text-sm font-semibold text-indigo-700">次の予定</p>
              {nextEvent ? (
                <>
                  <p className="mt-2 text-sm font-semibold">{nextEvent.date} {nextEvent.time}</p>
                  <p className="mt-1 text-sm text-ink/70">{nextEvent.title}</p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-ink/60">予定はまだありません。</p>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex items-center justify-between md:hidden">
              <div>
                <p className="text-sm text-ink/60">毎日の記録をやさしく管理</p>
                <h1 className="text-2xl font-semibold tracking-tight">レオン成長記録</h1>
              </div>
            </div>

            <InstallPrompt />
            <NotificationCenter />
            {saveError ? (
              <section className="card mb-5 border-rose-200 bg-rose-50/90 p-4">
                <p className="text-sm font-semibold text-rose-700">保存エラー</p>
                <p className="mt-1 text-sm leading-6 text-rose-700/90">{saveError}</p>
              </section>
            ) : null}
            <main>{children}</main>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center justify-around gap-1 rounded-t-4xl border border-white/80 bg-white/95 px-1 py-4 shadow-[0_-12px_30px_-20px_rgba(47,42,37,0.35)] backdrop-blur md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-1.5 py-2 text-[10px] font-medium transition sm:text-[11px] ${
                active ? "bg-ink text-white" : "text-ink/70 hover:bg-sand/30"
              }`}
            >
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
