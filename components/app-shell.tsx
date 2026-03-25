"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/components/app-provider";
import { InstallPrompt } from "@/components/install-prompt";
import { NotificationCenter } from "@/components/notification-center";
import { PwaRegister } from "@/components/pwa-register";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/records", label: "記録一覧" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/health", label: "健康" },
  { href: "/profile", label: "プロフィール" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { saveError } = useAppData();

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-6">
      <PwaRegister />
      <div className="mb-5 flex items-center justify-between">
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

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center justify-around rounded-t-4xl border border-white/80 bg-white/95 px-2 py-4 shadow-[0_-12px_30px_-20px_rgba(47,42,37,0.35)] backdrop-blur">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-2 py-2 text-xs font-medium transition ${
                active ? "bg-ink text-white" : "text-ink/70 hover:bg-sand/30"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
