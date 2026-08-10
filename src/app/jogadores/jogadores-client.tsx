"use client";

import { useState, type FormEvent } from "react";
import { IconeCarregando } from "@/components/icone-carregando";
import { formatarTelefone } from "@/lib/auth/telefone";

interface Jogador {
  id: number;
  nome: string;
  ativo: boolean;
  ehOrganizador: boolean;
  telefone: string | null;
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

/**
 * Estrela clicável pra promover/rebaixar um Jogador a Organizador — quem
 * ainda não tem telefone precisa informar um antes de virar Organizador
 * (é como ele vai logar); um formulário inline aparece só nesse caso, em
 * vez de um `prompt()` do navegador.
 */
function BotaoOrganizador({
  jogador,
  carregando,
  erro,
  onDefinir,
}: {
  jogador: Jogador;
  carregando: boolean;
  erro: string | null;
  onDefinir: (id: number, ehOrganizador: boolean, telefone?: string) => void;
}) {
  const [pedindoTelefone, setPedindoTelefone] = useState(false);
  const [telefone, setTelefone] = useState("");

  function clicar() {
    if (jogador.ehOrganizador) {
      if (
        confirm(
          `Remover ${jogador.nome} como Organizador? A senha atual dele deixa de funcionar.`,
        )
      ) {
        onDefinir(jogador.id, false);
      }
      return;
    }

    if (jogador.telefone) {
      if (
        confirm(
          `Tornar ${jogador.nome} Organizador? A senha inicial será os últimos 4 dígitos do telefone já cadastrado.`,
        )
      ) {
        onDefinir(jogador.id, true);
      }
      return;
    }

    setPedindoTelefone(true);
  }

  if (pedindoTelefone) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="tel"
          autoFocus
          placeholder="(11) 99999-8888"
          value={telefone}
          onChange={(event) => setTelefone(formatarTelefone(event.target.value))}
          className="w-36 rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-label-sm text-on-surface"
        />
        <button
          type="button"
          disabled={carregando || !telefone.trim()}
          onClick={() => onDefinir(jogador.id, true, telefone)}
          className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-label-sm text-on-secondary disabled:opacity-40"
        >
          {carregando && <IconeCarregando tamanho={14} />}
          OK
        </button>
        <button
          type="button"
          onClick={() => setPedindoTelefone(false)}
          className="text-label-sm text-on-surface-variant"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={carregando}
        onClick={clicar}
        aria-label={jogador.ehOrganizador ? `Remover ${jogador.nome} como Organizador` : `Tornar ${jogador.nome} Organizador`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest disabled:opacity-50"
        title={jogador.ehOrganizador ? "Organizador — clique pra remover" : "Tornar Organizador"}
      >
        {carregando ? (
          <IconeCarregando />
        ) : (
          <span
            className={`material-symbols-outlined ${jogador.ehOrganizador ? "text-secondary" : ""}`}
            style={jogador.ehOrganizador ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            star
          </span>
        )}
      </button>
      {erro && (
        <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-error/40 bg-surface-container-high p-3 text-label-sm text-error shadow-lg">
          {erro}
        </div>
      )}
    </div>
  );
}

/** Um Jogador na lista — avatar, nome editável inline, status, e o toggle. */
function LinhaDeJogador({
  jogador,
  salvandoOrganizador,
  erroOrganizador,
  onRenomear,
  onAlternarAtivo,
  onDefinirOrganizador,
}: {
  jogador: Jogador;
  salvandoOrganizador: boolean;
  erroOrganizador: string | null;
  onRenomear: (id: number, nome: string) => void;
  onAlternarAtivo: (id: number, ativo: boolean) => void;
  onDefinirOrganizador: (id: number, ehOrganizador: boolean, telefone?: string) => void;
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
          </div>
          <span
            className={`text-label-sm ${jogador.ativo ? "text-primary" : "text-on-surface-variant"}`}
          >
            {jogador.ativo ? "Ativo" : "Inativo"}
            {jogador.ehOrganizador ? " · Organizador" : ""}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <BotaoOrganizador
          jogador={jogador}
          carregando={salvandoOrganizador}
          erro={erroOrganizador}
          onDefinir={onDefinirOrganizador}
        />
        {!jogador.ehOrganizador && (
          <ToggleAtivo
            ativo={jogador.ativo}
            onChange={(valor) => onAlternarAtivo(jogador.id, valor)}
            label={jogador.ativo ? `Desativar ${jogador.nome}` : `Reativar ${jogador.nome}`}
          />
        )}
      </div>
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
  const [salvandoOrganizadorId, setSalvandoOrganizadorId] = useState<number | null>(null);
  const [erroOrganizador, setErroOrganizador] = useState<{ id: number; mensagem: string } | null>(
    null,
  );

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

  async function definirOrganizador(id: number, ehOrganizador: boolean, telefone?: string) {
    setErroOrganizador(null);
    setSalvandoOrganizadorId(id);
    try {
      const resposta = await fetch(`/api/jogadores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ehOrganizador, telefone }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErroOrganizador({ id, mensagem: corpo?.error ?? "Não foi possível atualizar." });
        return;
      }

      setJogadores((atual) => atual.map((j) => (j.id === id ? corpo.jogador : j)));
    } finally {
      setSalvandoOrganizadorId(null);
    }
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
              salvandoOrganizador={salvandoOrganizadorId === jogador.id}
              erroOrganizador={erroOrganizador?.id === jogador.id ? erroOrganizador.mensagem : null}
              onRenomear={renomear}
              onAlternarAtivo={alternarAtivo}
              onDefinirOrganizador={definirOrganizador}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
