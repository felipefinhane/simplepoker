import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { RegisterServiceWorker } from "./register-sw";
import { AppShell } from "@/components/app-shell";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { THEME_COLOR } from "@/lib/theme";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Simplepoker",
  description:
    "Ranking, resultados e caixa do campeonato de poker semanal do grupo.",
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const organizador = await getOrganizadorLogado();

  return (
    <html
      lang="pt-BR"
      className={`${hankenGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        {/* Ícones usados nas telas (ver AppShell e as páginas) — não tem
            suporte no next/font/google por ser uma fonte de símbolos, não
            de texto, então entra como stylesheet direto. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RegisterServiceWorker />
        <AppShell organizador={organizador}>{children}</AppShell>
      </body>
    </html>
  );
}
