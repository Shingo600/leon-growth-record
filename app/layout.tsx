import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "レオン成長記録",
  description: "愛犬の成長記録と予定をひとつにまとめるスマホ向けMVPアプリ",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "レオン成長記録"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icons/leon-20261014-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/leon-20261014-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/leon-20261014-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/leon-20261014-apple-180.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#f7f2ea",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
