"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Organizador } from "@/lib/auth/organizador";

interface NavItem {
  href: string;
  label: string;
  icone: string;
}

const ITENS_DE_NAVEGACAO: NavItem[] = [
  { href: "/", label: "Ranking", icone: "trophy" },
  { href: "/partidas", label: "Partidas", icone: "playing_cards" },
  { href: "/blinds", label: "Blinds", icone: "timer" },
  { href: "/caixa", label: "Caixa", icone: "account_balance_wallet" },
  { href: "/historico", label: "Histórico", icone: "history" },
];

/** Ícone Material Symbols, preenchido quando `ativo`. */
function Icone({ nome, ativo }: { nome: string; ativo?: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      style={ativo ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {nome}
    </span>
  );
}

/** Um item de navegação — visual muda conforme `variante` (side nav vs. bottom nav). */
function ItemDeNavegacao({
  item,
  ativo,
  variante,
}: {
  item: NavItem;
  ativo: boolean;
  variante: "lateral" | "inferior";
}) {
  const className =
    variante === "lateral"
      ? `flex items-center gap-3 rounded-lg p-3 transition-colors ${
          ativo
            ? "bg-surface-container-high font-bold text-secondary"
            : "text-on-surface-variant hover:bg-surface-container-high"
        }`
      : `flex flex-col items-center justify-center transition-all ${
          ativo
            ? "scale-95 border-b-2 border-secondary pb-1 font-bold text-secondary duration-100"
            : "text-on-surface-variant hover:text-secondary"
        }`;

  return (
    <Link href={item.href} className={className}>
      <Icone nome={item.icone} ativo={ativo} />
      <span className={variante === "inferior" ? "mt-1 text-label-sm" : undefined}>
        {item.label}
      </span>
    </Link>
  );
}

/**
 * Casca da aplicação: barra superior (logo + conta) e navegação principal —
 * bottom nav fixa no mobile, side nav no desktop. Ranking/Partidas/Caixa/
 * Histórico são públicos; o ícone de conta leva direto pro Login quando
 * ninguém está autenticado, ou abre um menu (Jogadores/Temporada/Trocar
 * senha/Sair) quando o Organizador está logado (ver `getOrganizadorLogado`,
 * resolvido no layout raiz).
 */
export function AppShell({
  organizador,
  children,
}: {
  organizador: Pick<Organizador, "nome"> | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  function estaAtivo(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  async function sair() {
    setMenuAberto(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col md:grid md:grid-cols-[240px_1fr] md:items-start">
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-surface-container-high bg-surface px-container-padding md:col-span-2 md:border-none">
        <Link href="/" className="flex items-center gap-2">
          <Icone nome="style" ativo />
          <span className="font-sans text-headline-md font-bold tracking-tight text-primary">
            Simplepoker
          </span>
        </Link>

        {organizador ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto((atual) => !atual)}
              aria-label="Conta"
              className="flex h-touch-target-min w-touch-target-min items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[24px]">account_circle</span>
            </button>

            {menuAberto && (
              <>
                {/* Fecha o menu ao clicar fora — não é um controle de
                    verdade, só captura o clique fora do menu. */}
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuAberto(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-outline-variant bg-surface-container-high py-2 shadow-lg">
                  <p className="px-4 py-2 text-label-sm text-on-surface-variant">
                    Olá, {organizador.nome}
                  </p>
                  <Link
                    href="/jogadores"
                    onClick={() => setMenuAberto(false)}
                    className="block px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-highest"
                  >
                    Jogadores
                  </Link>
                  <Link
                    href="/temporadas"
                    onClick={() => setMenuAberto(false)}
                    className="block px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-highest"
                  >
                    Temporada
                  </Link>
                  <Link
                    href="/conta/trocar-senha"
                    onClick={() => setMenuAberto(false)}
                    className="block px-4 py-2 text-body-md text-on-surface hover:bg-surface-container-highest"
                  >
                    Trocar senha
                  </Link>
                  <button
                    type="button"
                    onClick={sair}
                    className="block w-full px-4 py-2 text-left text-body-md text-error hover:bg-surface-container-highest"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            aria-label="Entrar como Organizador"
            className="flex h-touch-target-min w-touch-target-min items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[24px]">account_circle</span>
          </Link>
        )}
      </header>

      <aside className="sticky top-14 hidden h-[calc(100vh-56px)] flex-col gap-2 border-r border-surface-container-high bg-surface p-4 md:flex">
        {ITENS_DE_NAVEGACAO.map((item) => (
          <ItemDeNavegacao
            key={item.href}
            item={item}
            ativo={estaAtivo(item.href)}
            variante="lateral"
          />
        ))}
      </aside>

      <div className="flex-1 overflow-y-auto pb-[100px] md:pb-0">{children}</div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-surface-variant bg-surface-container/90 px-4 pb-safe pt-2 shadow-lg backdrop-blur-md md:hidden">
        {ITENS_DE_NAVEGACAO.map((item) => (
          <ItemDeNavegacao
            key={item.href}
            item={item}
            ativo={estaAtivo(item.href)}
            variante="inferior"
          />
        ))}
      </nav>
    </div>
  );
}
