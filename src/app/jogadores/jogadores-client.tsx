"use client";

import { useState, type FormEvent } from "react";
import { IconeCarregando } from "@/components/icone-carregando";

interface Jogador {
  id: number;
  nome: string;
  ativo: boolean;
  ehOrganizador: boolean;
}

function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase();
}

/** Switch estilo iOS — checkbox de verdade por baixo, só o visual é custom. */
function ToggleAtivo({
  ativo,
  onChange,
  label,
}: {
  ativo: boolean;
  onChange: (valor: boolean) => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center" aria-label={label}>
      <input
        type="checkbox"
        checked={ativo}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <div className="h-6 w-11 rounded-full bg-surface-variant transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-primary-container peer-checked:after:translate-x-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary" />
    </label>
  );
}

/** Um Jogador na lista — avatar, nome editável inline, status, e o toggle. */
function LinhaDeJogador({
  jogador,
  onRenomear,
  onAlternarAtivo,
}: {
  jogador: Jogador;
  onRenomear: (id: number, nome: string) => void;
  onAlternarAtivo: (id: number, ativo: boolean) => void;
}) {
  return (
    <div
      className={`group flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
        jogador.ativo
          ? "border-outline-variant/30 bg-surface-container hover:bg-surface-container-high"
          : "border-outline-variant/10 bg-surface-container-lowest opacity-60 grayscale hover:opacity-80 hover:grayscale-0"
      }`}
    >
      <div className="flex flex-1 items-center gap-4 overflow-hidden">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-headline-md font-semibold ${
            jogador.ativo
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-variant text-on-surface-variant"
          }`}
        >
          {inicial(jogador.nome)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <input
              type="text"
              defaultValue={jogador.nome}
              onBlur={(event) => {
                const nome = event.target.value.trim();
                if (nome && nome !== jogador.nome) onRenomear(jogador.id, nome);
                else event.target.value = jogador.nome;
              }}
              className="min-w-0 flex-1 truncate rounded bg-transparent text-headline-md font-semibold text-on-surface focus:bg-surface-container-highest focus:px-1 focus:outline-none"
            />
            {jogador.ehOrganizador && (
              <span
                className="material-symbols-outlined shrink-0 text-sm text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                title="Organizador"
              >
                star
              </span>
            )}
          </div>
          <span
            className={`text-label-sm ${jogador.ativo ? "text-primary" : "text-on-surface-variant"}`}
          >
            {jogador.ativo ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {jogador.ehOrganizador ? (
        <span
          className="material-symbols-outlined shrink-0 text-secondary"
          style={{ fontVariationSettings: "'FILL' 1" }}
          title="Organizador — não pode ser desativado por aqui"
        >
          star
        </span>
      ) : (
        <ToggleAtivo
          ativo={jogador.ativo}
          onChange={(valor) => onAlternarAtivo(jogador.id, valor)}
          label={jogador.ativo ? `Desativar ${jogador.nome}` : `Reativar ${jogador.nome}`}
        />
      )}
    </div>
  );
}

export function JogadoresClient({
  jogadoresIniciais,
}: {
  jogadoresIniciais: Jogador[];
}) {
  const [jogadores, setJogadores] = useState(jogadoresIniciais);
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function cadastrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/jogadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível cadastrar.");
        return;
      }

      setJogadores((atual) =>
        [...atual, corpo.jogador].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setNovoNome("");
    } finally {
      setEnviando(false);
    }
  }

  async function renomear(id: number, nome: string) {
    setErro(null);
    const resposta = await fetch(`/api/jogadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setErro(corpo?.error ?? "Não foi possível renomear.");
      return;
    }

    setJogadores((atual) => atual.map((j) => (j.id === id ? corpo.jogador : j)));
  }

  async function alternarAtivo(id: number, ativo: boolean) {
    setErro(null);
    // Otimista: o toggle é um checkbox controlado por `jogador.ativo`, e
    // sem atualizar o estado local na hora, ele "pisca" — volta pra
    // posição antiga por um instante (esperando o fetch) e só depois vira
    // de vez — parece que o toque não registrou. Atualiza já, e desfaz se
    // o servidor recusar.
    const anterior = jogadores;
    setJogadores((atual) => atual.map((j) => (j.id === id ? { ...j, ativo } : j)));

    const resposta = await fetch(`/api/jogadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setJogadores(anterior);
      setErro(corpo?.error ?? "Não foi possível atualizar.");
      return;
    }

    setJogadores((atual) => atual.map((j) => (j.id === id ? corpo.jogador : j)));
  }

  const ativos = jogadores.filter((j) => j.ativo).length;

  return (
    <div className="flex flex-col gap-section-margin">
      <section className="rounded-xl border border-surface-variant bg-surface-container-low p-4 shadow-lg">
        <form onSubmit={cadastrar} className="flex flex-col gap-stack-gap sm:flex-row">
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-lg text-on-surface-variant">
              person_add
            </span>
            <input
              type="text"
              placeholder="Nome do novo jogador..."
              required
              value={novoNome}
              onChange={(event) => setNovoNome(event.target.value)}
              className="block w-full rounded-lg border border-outline-variant bg-surface-container-highest py-3 pl-10 pr-3 text-body-md text-on-surface placeholder-on-surface-variant/50 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="flex h-14 items-center justify-center gap-2 rounded-lg bg-secondary px-6 text-headline-md font-bold text-on-secondary transition-colors hover:bg-secondary-fixed disabled:opacity-60 sm:h-auto"
          >
            {enviando ? (
              <IconeCarregando />
            ) : (
              <span className="material-symbols-outlined font-bold">add</span>
            )}
            Adicionar
          </button>
        </form>
      </section>

      {erro && (
        <p className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
          {erro}
        </p>
      )}

      <section className="flex flex-col gap-stack-gap">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Lista Alfabética ({jogadores.length})
          </h3>
          <div className="flex gap-2 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> Ativos ({ativos})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-surface-variant" /> Inativos (
              {jogadores.length - ativos})
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {jogadores.map((jogador) => (
            <LinhaDeJogador
              key={jogador.id}
              jogador={jogador}
              onRenomear={renomear}
              onAlternarAtivo={alternarAtivo}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
