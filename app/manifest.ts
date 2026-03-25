import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "レオン成長記録",
    short_name: "レオン記録",
    description: "愛犬の成長記録と予定を1つにまとめるスマホ向けアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f2ea",
    theme_color: "#f7f2ea",
    lang: "ja",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
