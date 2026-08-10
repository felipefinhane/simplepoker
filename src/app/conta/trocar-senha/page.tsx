"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { IconeCarregando } from "@/components/icone-carregando";

const CAMPO_CLASSE =
  "block w-full rounded-lg border border-outline-variant bg-surface-container-highest py-3 pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder-on-surface-variant/50 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export default function TrocarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível trocar a senha.");
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setMensagem("Senha alterada.");
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
          <span className="material-symbols-outlined text-4xl leading-none text-primary" aria-hidden>
            key
          </span>
          <h1 className="text-headline-lg text-on-surface">Trocar senha</h1>
          <p className="text-body-md text-on-surface-variant">
            Confirme a senha atual e escolha a nova
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card flex flex-col gap-stack-gap rounded-xl p-6"
        >
          <div>
            <label
              htmlFor="senha-atual"
              className="mb-1 block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Senha atual
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-lg text-on-surface-variant">
                lock
              </span>
              <input
                id="senha-atual"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                className={CAMPO_CLASSE}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="nova-senha"
              className="mb-1 block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Nova senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-lg text-on-surface-variant">
                lock_reset
              </span>
              <input
                id="nova-senha"
                type="password"
                required
                minLength={4}
                autoComplete="new-password"
                placeholder="Pelo menos 4 caracteres"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
                className={CAMPO_CLASSE}
              />
            </div>
          </div>

          {erro && (
            <p className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
              {erro}
            </p>
          )}
          {mensagem && (
            <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-container/20 px-3 py-2 text-body-md text-primary">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 flex h-touch-target-min items-center justify-center gap-2 rounded-lg bg-secondary text-label-sm font-bold uppercase tracking-wider text-on-secondary transition-colors hover:bg-secondary-fixed disabled:opacity-60"
          >
            {enviando && <IconeCarregando />}
            {enviando ? "Salvando..." : "Salvar"}
          </button>

          <Link
            href="/"
            className="text-center text-label-sm text-on-surface-variant hover:text-primary"
          >
            ← Voltar
          </Link>
        </form>
      </div>
    </main>
  );
}
