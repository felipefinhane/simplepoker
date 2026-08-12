"use client";

import { useSyncExternalStore } from "react";

const CHAVE = "daltonismo";

type Escutador = () => void;
let escutadores: Escutador[] = [];

function lerAtivo(): boolean {
  return document.documentElement.dataset.daltonismo === "true";
}

/** `document.documentElement.dataset` é externo ao React — precisa de inscrição de verdade (ver `definirAtivo`). */
function inscrever(escutador: Escutador) {
  escutadores.push(escutador);
  return () => {
    escutadores = escutadores.filter((e) => e !== escutador);
  };
}

function definirAtivo(valor: boolean) {
  document.documentElement.dataset.daltonismo = valor ? "true" : "false";
  localStorage.setItem(CHAVE, valor ? "true" : "false");
  escutadores.forEach((escutador) => escutador());
}

/**
 * Modo daltonismo (ticket 53) — troca a paleta verde/vermelho (a mais
 * difícil de distinguir em deuteranopia/protanopia) por azul/laranja, via
 * `html[data-daltonismo="true"]` (ver globals.css). Preferência 100%
 * local (`localStorage`), sem servidor — é do dispositivo, não da conta.
 *
 * `useSyncExternalStore`, não `useState`+`useEffect`: o valor de verdade
 * mora fora do React (`document.documentElement.dataset`, já setado antes
 * do primeiro paint por um script inline no `<head>`, ver layout.tsx) —
 * `getServerSnapshot` (`() => false`) mantém a SSR/primeira hidratação
 * seguras sem mismatch, e a leitura real assume assim que monta.
 */
export function ToggleDaltonismo() {
  const ativo = useSyncExternalStore(inscrever, lerAtivo, () => false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      onClick={() => definirAtivo(!ativo)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-surface-container-high bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
    >
      <span className="flex items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant">palette</span>
        <span>
          <span className="block text-body-md text-on-surface">Modo daltonismo</span>
          <span className="block text-label-sm text-on-surface-variant">
            Troca a paleta de cores por uma com mais contraste entre verde e vermelho.
          </span>
        </span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          ativo ? "bg-primary" : "bg-surface-container-highest"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-surface transition-transform ${
            ativo ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
