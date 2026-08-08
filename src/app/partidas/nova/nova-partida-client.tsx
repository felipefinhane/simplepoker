"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Jogador {
  id: number;
  nome: string;
}

const MINIMO_DE_PARTICIPANTES = 5;

function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase();
}

export function NovaPartidaClient({
  jogadoresAtivos,
}: {
  jogadoresAtivos: Jogador[];
}) {
  const router = useRouter();
  const [jogadores, setJogadores] = useState(jogadoresAtivos);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [cadastrando, setCadastrando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function alternar(jogadorId: number) {
    setSelecionados((atual) =>
      atual.includes(jogadorId)
        ? atual.filter((id) => id !== jogadorId)
        : [...atual, jogadorId],
    );
  }

  async function cadastrarNovoJogador(event: FormEvent) {
    event.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    setErro(null);

    const resposta = await fetch("/api/jogadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setErro(corpo?.error ?? "Não foi possível cadastrar o Jogador.");
      return;
    }

    const jogador = corpo.jogador as Jogador;
    setJogadores((atual) => [...atual, jogador].sort((a, b) => a.nome.localeCompare(b.nome)));
    setSelecionados((atual) => [...atual, jogador.id]);
    setNovoNome("");
    setCadastrando(false);
  }

  async function criar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/partidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, jogadorIds: selecionados }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível criar a Partida.");
        return;
      }

      router.push(`/partidas/${corpo.partida.id}`);
    } finally {
      setEnviando(false);
    }
  }

  const faltam = Math.max(0, MINIMO_DE_PARTICIPANTES - selecionados.length);

  return (
    <form onSubmit={criar} className="flex flex-col gap-section-margin">
      <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
        <label htmlFor="data-partida" className="mb-2 block text-label-sm uppercase tracking-wider text-on-surface-variant">
          Data
        </label>
        <input
          id="data-partida"
          type="date"
          required
          value={data}
          onChange={(event) => setData(event.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <section className="flex flex-col gap-stack-gap">
        <div className="flex items-end justify-between">
          <h3 className="text-headline-md text-on-surface">Participantes</h3>
          <span
            className={`rounded-lg px-3 py-1 text-label-data ${
              faltam > 0
                ? "bg-error-container/20 text-error"
                : "bg-primary-container/20 text-primary"
            }`}
          >
            {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
            {faltam > 0 ? ` · faltam ${faltam}` : ""}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {jogadores.map((jogador) => {
            const marcado = selecionados.includes(jogador.id);
            return (
              <label
                key={jogador.id}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-colors ${
                  marcado
                    ? "border-primary bg-primary-container/10"
                    : "border-outline-variant/30 bg-surface-container hover:bg-surface-container-high"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(jogador.id)}
                  className="h-5 w-5 shrink-0 rounded border-outline-variant bg-surface-container-highest text-primary focus:ring-primary focus:ring-offset-surface"
                />
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body-md font-semibold ${
                    marcado
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {inicial(jogador.nome)}
                </div>
                <span className="flex-1 text-body-md text-on-surface">{jogador.nome}</span>
              </label>
            );
          })}
          {jogadores.length === 0 && !cadastrando && (
            <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
              Nenhum Jogador ativo cadastrado ainda.
            </p>
          )}
        </div>

        {cadastrando ? (
          <div className="flex flex-col gap-3 rounded-lg border border-surface-variant bg-surface-container-low p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do novo Jogador"
                value={novoNome}
                onChange={(event) => setNovoNome(event.target.value)}
                className="flex-1 rounded-lg border border-outline-variant bg-surface-container-highest px-3 py-2 text-on-surface placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={cadastrarNovoJogador}
                disabled={!novoNome.trim()}
                className="rounded-lg bg-secondary px-4 py-2 text-label-sm font-bold text-on-secondary disabled:opacity-40"
              >
                Cadastrar
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCadastrando(false)}
              className="self-start text-label-sm text-on-surface-variant hover:text-on-surface"
            >
              Fechar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCadastrando(true)}
            className="flex min-h-touch-target-min w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary-container text-body-md font-semibold text-primary transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">person_add</span>
            Cadastrar novo Jogador
          </button>
        )}
      </section>

      {erro && (
        <p className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || faltam > 0}
        className="flex h-14 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-on-secondary shadow-[0_0_15px_rgba(233,195,73,0.2)] transition-colors hover:bg-secondary-fixed-dim disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando
          ? "Criando..."
          : faltam > 0
            ? `Selecione mais ${faltam} participante${faltam === 1 ? "" : "s"}`
            : "Criar Partida"}
      </button>
    </form>
  );
}
