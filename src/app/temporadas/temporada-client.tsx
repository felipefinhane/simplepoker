"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconeCarregando } from "@/components/icone-carregando";

interface NivelDeBlind {
  blindPequeno: number;
  blindGrande: number;
  duracaoMinutos: number;
}

interface FichaInicial {
  valor: number;
  quantidade: number;
}

interface ParametrosSerializados {
  tabelaDePontos: [number, number][];
  valorDaPartida: number;
  multiplicadorPremiacaoPrimeiro: number;
  multiplicadorPremiacaoSegundo: number;
  estruturaDeBlinds: NivelDeBlind[];
  fichasIniciais: FichaInicial[];
}

interface ResumoParaEncerrar {
  totalDePartidas: number;
  lider: string | null;
}

const CARD_CLASSE = "rounded-xl border border-surface-variant bg-surface-container-low p-5";
const LEGENDA_CLASSE = "mb-4 flex items-center gap-2 text-headline-md text-on-surface";
const INPUT_CLASSE =
  "w-full rounded-lg border border-surface-variant bg-surface-container-highest px-3 py-2 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const BOTAO_ADICIONAR_CLASSE =
  "mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary-container py-3 text-primary transition-colors hover:bg-surface-container";
const BOTAO_REMOVER_CLASSE =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container/20 hover:text-error";

/** Modal de confirmação pra Encerrar Temporada (ação irreversível). */
function ModalEncerrarTemporada({
  resumo,
  enviando,
  onCancelar,
  onConfirmar,
}: {
  resumo: ResumoParaEncerrar;
  enviando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-container-lowest/80 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancelar}
    >
      <article
        role="dialog"
        aria-labelledby="modal-encerrar-titulo"
        aria-describedby="modal-encerrar-descricao"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-surface-container shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 border-b border-surface-container-high p-6 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-error/20 bg-error-container/20">
            <span
              className="material-symbols-outlined text-3xl text-error"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
          </div>
          <h2 id="modal-encerrar-titulo" className="text-headline-md text-error">
            Encerrar Temporada?
          </h2>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <p id="modal-encerrar-descricao" className="text-center text-body-md text-on-surface-variant">
            Esta ação é irreversível. Os Parâmetros ficam congelados e nenhuma
            nova Partida poderá ser lançada nesta Temporada.
          </p>

          <div className="flex flex-col gap-3 rounded-xl border border-surface-bright bg-surface-container-low p-4">
            <div className="flex items-center justify-between border-b border-surface-bright/50 pb-3">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Total de Partidas
              </span>
              <span className="flex items-center gap-2 font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  playing_cards
                </span>
                {resumo.totalDePartidas}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Líder Atual
              </span>
              <span className="flex items-center gap-2 font-bold text-secondary">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  trophy
                </span>
                {resumo.lider ?? "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-stack-gap p-6 pt-0 sm:flex-row-reverse">
          <button
            type="button"
            disabled={enviando}
            onClick={onConfirmar}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-error text-label-sm font-bold uppercase tracking-wide text-on-error transition-transform hover:bg-error/90 active:scale-[0.98] disabled:opacity-60"
          >
            {enviando ? (
              <IconeCarregando />
            ) : (
              <span className="material-symbols-outlined text-[20px]">lock</span>
            )}
            {enviando ? "Encerrando..." : "Confirmar e Encerrar"}
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={onCancelar}
            className="flex h-14 flex-1 items-center justify-center rounded-xl text-label-sm font-bold uppercase tracking-wide text-on-surface-variant transition-colors hover:bg-surface-bright/50"
          >
            Cancelar
          </button>
        </div>
      </article>
    </div>
  );
}

export function TemporadaClient({
  modo,
  temporadaId,
  parametrosIniciais,
  resumoParaEncerrar,
}: {
  modo: "criar" | "editar";
  temporadaId?: number;
  parametrosIniciais: ParametrosSerializados;
  resumoParaEncerrar?: ResumoParaEncerrar;
}) {
  const router = useRouter();
  const [tabelaDePontos, setTabelaDePontos] = useState(
    [...parametrosIniciais.tabelaDePontos].sort((a, b) => a[0] - b[0]),
  );
  const [valorDaPartida, setValorDaPartida] = useState(
    parametrosIniciais.valorDaPartida,
  );
  const [multiplicadorPrimeiro, setMultiplicadorPrimeiro] = useState(
    parametrosIniciais.multiplicadorPremiacaoPrimeiro,
  );
  const [multiplicadorSegundo, setMultiplicadorSegundo] = useState(
    parametrosIniciais.multiplicadorPremiacaoSegundo,
  );
  const [blinds, setBlinds] = useState(parametrosIniciais.estruturaDeBlinds);
  const [fichas, setFichas] = useState(parametrosIniciais.fichasIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const corpo = {
      tabelaDePontos,
      valorDaPartida,
      multiplicadorPremiacaoPrimeiro: multiplicadorPrimeiro,
      multiplicadorPremiacaoSegundo: multiplicadorSegundo,
      estruturaDeBlinds: blinds,
      fichasIniciais: fichas,
    };

    try {
      const resposta = await fetch(
        modo === "criar" ? "/api/temporadas" : `/api/temporadas/${temporadaId}`,
        {
          method: modo === "criar" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        },
      );
      const respostaCorpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(respostaCorpo?.error ?? "Não foi possível salvar.");
        return;
      }

      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function encerrar() {
    if (!temporadaId) return;

    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch(`/api/temporadas/${temporadaId}/encerrar`, {
        method: "POST",
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível encerrar.");
        return;
      }

      setModalAberto(false);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <form onSubmit={salvar} className="flex flex-col gap-section-margin">
        <p className="text-body-md text-on-surface-variant">
          {modo === "criar"
            ? "Nenhuma Temporada aberta — crie uma nova."
            : "Editando a Temporada aberta."}
        </p>

        {/* Tabela de Pontos */}
        <section className={CARD_CLASSE}>
          <h2 className={LEGENDA_CLASSE}>
            <span className="material-symbols-outlined text-secondary">social_leaderboard</span>
            Tabela de Pontos
          </h2>
          <div className="flex flex-col gap-3">
            {tabelaDePontos.map(([posicao, pontos], indice) => (
              <div
                key={posicao}
                className="flex items-center gap-4 rounded-lg border border-surface-variant bg-surface-container p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-lg font-bold text-on-secondary-container">
                  {posicao}º
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Pontos Base
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pontos}
                    onChange={(event) => {
                      const novoValor = Number(event.target.value);
                      setTabelaDePontos((atual) =>
                        atual.map((item, i) => (i === indice ? [posicao, novoValor] : item)),
                      );
                    }}
                    className="w-full bg-transparent text-lg text-on-surface focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setTabelaDePontos((atual) => [
                ...atual,
                [(atual.at(-1)?.[0] ?? 0) + 1, 0],
              ])
            }
            className={BOTAO_ADICIONAR_CLASSE}
          >
            <span className="material-symbols-outlined">add</span>
            Adicionar Posição
          </button>
        </section>

        {/* Valores da Partida */}
        <section className={CARD_CLASSE}>
          <h2 className={LEGENDA_CLASSE}>
            <span className="material-symbols-outlined text-secondary">payments</span>
            Valores da Partida
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="valorDaPartida"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Valor da Entrada (R$)
              </label>
              <input
                id="valorDaPartida"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={valorDaPartida}
                onChange={(event) => setValorDaPartida(Number(event.target.value))}
                className={INPUT_CLASSE}
              />
            </div>
            <div>
              <label
                htmlFor="multPrimeiro"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-secondary"
              >
                1º Lugar (× valor)
              </label>
              <input
                id="multPrimeiro"
                type="number"
                min={0}
                step="0.1"
                required
                value={multiplicadorPrimeiro}
                onChange={(event) => setMultiplicadorPrimeiro(Number(event.target.value))}
                className={INPUT_CLASSE}
              />
            </div>
            <div>
              <label
                htmlFor="multSegundo"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                2º Lugar (× valor)
              </label>
              <input
                id="multSegundo"
                type="number"
                min={0}
                step="0.1"
                required
                value={multiplicadorSegundo}
                onChange={(event) => setMultiplicadorSegundo(Number(event.target.value))}
                className={INPUT_CLASSE}
              />
            </div>
          </div>
        </section>

        {/* Estrutura de Blinds */}
        <section className="felt-glow relative overflow-hidden rounded-xl border border-primary-fixed-dim/20 bg-primary-container p-5">
          <span
            className="material-symbols-outlined pointer-events-none absolute -bottom-4 -right-4 select-none text-[120px] text-black/10"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            playing_cards
          </span>
          <h2 className="relative z-10 mb-4 flex items-center gap-2 text-headline-md text-white">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              timer
            </span>
            Estrutura de Blinds
          </h2>
          <div className="relative z-10 flex flex-col gap-2">
            {blinds.length > 0 && (
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/70">
                <span>Nv.</span>
                <span className="text-center">SB</span>
                <span className="text-center">BB</span>
                <span className="text-center">Min</span>
                <span />
              </div>
            )}
            {blinds.map((nivel, indice) => (
              <div
                key={indice}
                className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2 transition-colors hover:bg-black/40"
              >
                <span className="text-center font-bold text-white">{indice + 1}</span>
                <input
                  type="number"
                  min={1}
                  aria-label="Small blind"
                  value={nivel.blindPequeno}
                  onChange={(event) =>
                    setBlinds((atual) =>
                      atual.map((n, i) =>
                        i === indice ? { ...n, blindPequeno: Number(event.target.value) } : n,
                      ),
                    )
                  }
                  className="w-full rounded border-b border-white/20 bg-transparent p-1 text-center font-mono text-white focus:border-secondary focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  aria-label="Big blind"
                  value={nivel.blindGrande}
                  onChange={(event) =>
                    setBlinds((atual) =>
                      atual.map((n, i) =>
                        i === indice ? { ...n, blindGrande: Number(event.target.value) } : n,
                      ),
                    )
                  }
                  className="w-full rounded border-b border-white/20 bg-transparent p-1 text-center font-mono text-white focus:border-secondary focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  aria-label="Duração em minutos"
                  value={nivel.duracaoMinutos}
                  onChange={(event) =>
                    setBlinds((atual) =>
                      atual.map((n, i) =>
                        i === indice ? { ...n, duracaoMinutos: Number(event.target.value) } : n,
                      ),
                    )
                  }
                  className="w-full rounded border-b border-white/20 bg-transparent p-1 text-center font-mono text-white focus:border-secondary focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Remover nível"
                  onClick={() => setBlinds((atual) => atual.filter((_, i) => i !== indice))}
                  className="flex items-center justify-center text-white/50 transition-colors hover:text-error"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setBlinds((atual) => [
                  ...atual,
                  { blindPequeno: 1, blindGrande: 2, duracaoMinutos: 15 },
                ])
              }
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-secondary/30 bg-black/40 py-3 font-bold text-secondary transition-all hover:bg-black/60"
            >
              <span className="material-symbols-outlined">add</span>
              Adicionar Nível
            </button>
          </div>
        </section>

        {/* Fichas Iniciais */}
        <section className={CARD_CLASSE}>
          <h2 className={LEGENDA_CLASSE}>
            <span className="material-symbols-outlined text-secondary">casino</span>
            Fichas Iniciais
          </h2>
          <div className="flex flex-col gap-2">
            {fichas.map((ficha, indice) => (
              <div key={indice} className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Valor da ficha
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ficha.valor}
                    onChange={(event) =>
                      setFichas((atual) =>
                        atual.map((f, i) =>
                          i === indice ? { ...f, valor: Number(event.target.value) } : f,
                        ),
                      )
                    }
                    className={INPUT_CLASSE}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ficha.quantidade}
                    onChange={(event) =>
                      setFichas((atual) =>
                        atual.map((f, i) =>
                          i === indice ? { ...f, quantidade: Number(event.target.value) } : f,
                        ),
                      )
                    }
                    className={INPUT_CLASSE}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remover ficha"
                  onClick={() => setFichas((atual) => atual.filter((_, i) => i !== indice))}
                  className={BOTAO_REMOVER_CLASSE}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFichas((atual) => [...atual, { valor: 100, quantidade: 10 }])}
            className={BOTAO_ADICIONAR_CLASSE}
          >
            <span className="material-symbols-outlined">add</span>
            Adicionar Ficha
          </button>
        </section>

        {erro && (
          <p className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex h-14 items-center justify-center gap-2 rounded-lg bg-secondary text-lg font-bold text-on-secondary shadow-[0_0_15px_rgba(233,195,73,0.2)] transition-colors hover:bg-secondary-fixed-dim disabled:opacity-60"
        >
          {enviando && <IconeCarregando />}
          {enviando
            ? "Salvando..."
            : modo === "criar"
              ? "Criar Temporada"
              : "Salvar Configurações"}
        </button>

        {modo === "editar" && resumoParaEncerrar && (
          <section className="mt-2 border-t border-error/20 pt-8">
            <h3 className="mb-2 flex items-center gap-2 text-headline-md text-error">
              <span className="material-symbols-outlined">warning</span>
              Zona de Perigo
            </h3>
            <p className="mb-4 text-body-md text-on-surface-variant">
              Encerra a Temporada atual, congela o ranking final e impede novas
              edições. Esta ação é irreversível.
            </p>
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-error text-lg font-bold text-error transition-colors hover:bg-error/10"
            >
              <span className="material-symbols-outlined">power_settings_new</span>
              Encerrar Temporada
            </button>
          </section>
        )}
      </form>

      {modalAberto && resumoParaEncerrar && (
        <ModalEncerrarTemporada
          resumo={resumoParaEncerrar}
          enviando={enviando}
          onCancelar={() => setModalAberto(false)}
          onConfirmar={encerrar}
        />
      )}
    </>
  );
}
