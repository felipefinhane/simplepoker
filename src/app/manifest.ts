import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Simplepoker",
    short_name: "Simplepoker",
    description:
      "Ranking, resultados e caixa do campeonato de poker semanal do grupo.",
    start_url: "/",
    display: "standalone",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
