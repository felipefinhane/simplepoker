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
  title: "Poker dos Amigos",
  description:
    "Ranking, resultados e caixa do campeonato de poker semanal do grupo.",
  // Safari no iOS não usa o manifest.ts (ticket 09) pra "Adicionar à Tela
  // de Início" — sem esses dois campos, o ícone salvo vira um print da
  // página e o app abre dentro do Safari (barra de endereço visível) em
  // vez de em tela cheia como um app instalado.
  appleWebApp: {
    capable: true,
    title: "Poker Amigos",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  // Sem isso, `env(safe-area-inset-bottom)` (usado no `pb-safe` do
  // BottomNavBar) resolve pra 0 no PWA instalado do iPhone — a barra
  // fica colada no indicador de início (home indicator), fácil de
  // acionar sem querer o gesto de minimizar/trocar de app ao tocar perto
  // do rodapé. Com `cover`, o Safari reporta o inset de verdade e o
  // `pb-safe` empurra a barra pra cima da área do gesto.
  viewportFit: "cover",
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
        {/* `metadata.appleWebApp` (acima) já gera a meta `mobile-web-app-capable`
            padrão — essa aqui é só o nome antigo com prefixo `apple-`, que
            versões de iOS anteriores ao Safari 17.4 ainda exigem pra abrir
            em tela cheia (sem barra de endereço) a partir da Tela de Início. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <RegisterServiceWorker />
        <AppShell organizador={organizador}>{children}</AppShell>
      </body>
    </html>
  );
}
