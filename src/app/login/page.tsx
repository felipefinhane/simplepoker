"use client";

import { useState, type FormEvent } from "react";
import { IconeCarregando } from "@/components/icone-carregando";
import { formatarTelefone } from "@/lib/auth/telefone";

const CAMPO_CLASSE =
  "block w-full rounded-lg border border-outline-variant bg-surface-container-highest py-3 pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder-on-surface-variant/50 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export default function LoginPage() {
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, senha }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.error ?? "Não foi possível entrar.");
        return;
      }

      // Navegação "dura" (não `router.push`) de propósito: garante que o
      // layout raiz reavalia `getOrganizadorLogado()` do zero numa página
      // nova, sem depender de uma transição client-side — mais robusto no
      // PWA instalado (Safari/iOS costuma ser instável com navegação via
      // History API dentro de um web app em modo standalone).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100dvh-56px)] items-center justify-center overflow-hidden px-container-padding py-section-margin">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-container/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary-container/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-section-margin flex flex-col items-center gap-2 text-center">
          <span className="text-4xl leading-none text-primary" aria-hidden>
            ♠
          </span>
          <h1 className="text-headline-lg text-on-surface">Entrar</h1>
          <p className="text-body-md text-on-surface-variant">
            Acesso do Organizador
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card flex flex-col gap-stack-gap rounded-xl p-6"
        >
          <div>
            <label
              htmlFor="telefone"
              className="mb-1 block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Celular
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-lg text-on-surface-variant">
                call
              </span>
              <input
                id="telefone"
                type="tel"
                required
                autoComplete="username"
                placeholder="(11) 99999-8888"
                value={telefone}
                onChange={(event) => setTelefone(formatarTelefone(event.target.value))}
                className={CAMPO_CLASSE}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-1 block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-lg text-on-surface-variant">
                lock
              </span>
              <input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className={CAMPO_CLASSE}
              />
            </div>
          </div>

          {erro && (
            <p className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 flex h-touch-target-min items-center justify-center gap-2 rounded-lg bg-secondary text-label-sm font-bold uppercase tracking-wider text-on-secondary transition-colors hover:bg-secondary-fixed disabled:opacity-60"
          >
            {enviando && <IconeCarregando />}
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
