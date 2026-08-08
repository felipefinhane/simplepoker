"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AtualizacaoDeLancamento, LancamentoDaPartida, Partida } from "@/lib/partidas";
import type { Jogador } from "@/lib/jogadores";

interface Premiacao {
  primeiro: number;
  segundo: number;
}

async function chamarApi(
  url: string,
  method: string,
  body?: unknown,
): Promise<{ ok: true; corpo: Record<string, unknown> } | { ok: false; erro: string }> {
  const resposta = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error ?? "Não foi possível." };
  }
  return { ok: true, corpo };
}

function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase();
}

/**
 * O Lançamento de um Jogador nesta Partida — mostra o estado rápido
 * (Ativo/Saiu, Pagou, Almas, Pontos) com dois jeitos de registrar o
 * resultado (ver CONTEXT.md — Partida em andamento): o botão "Saiu"
 * (fluxo ao vivo, atribui a posição sozinho) e um editor manual (posição
 * + eliminador, pro fluxo "lançar tudo no final" ou pra corrigir algo já
 * lançado).
 */
function LinhaDeLancamento({
  lancamento,
  ativos,
  todos,
  onAtualizar,
  onSair,
}: {
  lancamento: LancamentoDaPartida;
  /** Só os ainda ativos — opções válidas pro fluxo rápido "Saiu". */
  ativos: LancamentoDaPartida[];
  /** Todo mundo — o editor manual aceita qualquer Jogador como eliminador. */
  todos: LancamentoDaPartida[];
  onAtualizar: (jogadorId: number, dados: AtualizacaoDeLancamento) => void;
  onSair: (jogadorId: number, eliminadoPorJogadorId: number | null) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [eliminadorEscolhido, setEliminadorEscolhido] = useState("");

  const estaAtivo = lancamento.posicao === null;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        estaAtivo
          ? "border-surface-variant bg-surface-container-low"
          : "border-surface-variant/50 bg-surface-container-lowest"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-body-md font-bold ${
              estaAtivo
                ? "border-secondary/30 bg-secondary/10 text-secondary"
                : "border-transparent bg-surface-variant text-on-surface-variant"
            }`}
          >
            {estaAtivo ? inicial(lancamento.nome) : lancamento.posicao}
          </div>
          <div className="min-w-0">
            <div
              className={`truncate text-body-md font-semibold ${
                estaAtivo ? "text-on-surface" : "text-on-surface-variant"
              }`}
            >
              {lancamento.nome}
            </div>
            {estaAtivo ? (
              <span className="mt-1 inline-block rounded bg-secondary/10 px-2 py-0.5 text-label-sm text-secondary">
                Ativo
              </span>
            ) : (
              <span className="mt-1 inline-block rounded bg-error-container/20 px-2 py-0.5 text-label-sm text-error">
                {lancamento.eliminadoPorNome
                  ? `Eliminado por: ${lancamento.eliminadoPorNome}`
                  : "Eliminado"}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="text-label-data font-bold text-on-surface">
            {lancamento.pontos ?? "—"} pts
          </div>
          <div className="flex items-center gap-1 text-xs text-error">
            <span className="material-symbols-outlined text-[14px]">skull</span>
            {lancamento.almas}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-label-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={lancamento.pagamento}
            onChange={(event) =>
              onAtualizar(lancamento.jogadorId, { pagamento: event.target.checked })
            }
            className="h-4 w-4 rounded border-outline-variant bg-surface-container-highest text-secondary"
          />
          Pagou
        </label>

        <div className="ml-auto flex items-center gap-2">
          {!estaAtivo && (
            <button
              type="button"
              onClick={() =>
                onAtualizar(lancamento.jogadorId, { posicao: null, eliminadoPorJogadorId: null })
              }
              className="flex items-center gap-1 rounded border border-outline-variant px-3 py-2 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
              Desfazer
            </button>
          )}

          {estaAtivo &&
            (saindo ? (
              <>
                <select
                  value={eliminadorEscolhido}
                  onChange={(event) => setEliminadorEscolhido(event.target.value)}
                  className="rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-label-sm text-on-surface"
                >
                  <option value="">Quem eliminou?</option>
                  {ativos
                    .filter((a) => a.jogadorId !== lancamento.jogadorId)
                    .map((a) => (
                      <option key={a.jogadorId} value={a.jogadorId}>
                        {a.nome}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    onSair(
                      lancamento.jogadorId,
                      eliminadorEscolhido ? Number(eliminadorEscolhido) : null,
                    );
                    setSaindo(false);
                    setEliminadorEscolhido("");
                  }}
                  className="rounded border border-secondary/30 bg-secondary/10 px-3 py-1 text-label-sm text-secondary"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setSaindo(false)}
                  className="text-label-sm text-on-surface-variant"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSaindo(true)}
                className="rounded border border-error/30 bg-error-container/20 px-4 py-2 text-label-sm text-error transition-colors hover:bg-error-container/40"
              >
                Saiu
              </button>
            ))}

          <button
            type="button"
            onClick={() => setEditando((atual) => !atual)}
            aria-label="Editar manualmente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>
      </div>

      {editando && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-container-high pt-3">
          <label className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            Posição
            <input
              type="number"
              min={1}
              defaultValue={lancamento.posicao ?? ""}
              onBlur={(event) => {
                const valor = event.target.value;
                const posicao = valor === "" ? null : Number(valor);
                if (posicao !== lancamento.posicao) {
                  onAtualizar(lancamento.jogadorId, { posicao });
                }
              }}
              className="w-16 rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-on-surface"
            />
          </label>
          <label className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            Eliminado por
            <select
              value={lancamento.eliminadoPorJogadorId ?? ""}
              onChange={(event) =>
                onAtualizar(lancamento.jogadorId, {
                  eliminadoPorJogadorId: event.target.value ? Number(event.target.value) : null,
                })
              }
              className="rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-on-surface"
            >
              <option value="">—</option>
              {todos
                .filter((outro) => outro.jogadorId !== lancamento.jogadorId)
                .map((outro) => (
                  <option key={outro.jogadorId} value={outro.jogadorId}>
                    {outro.nome}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

export function PartidaEmAndamentoClient({
  partida: partidaInicial,
  jogadoresForaDaPartida: foraInicial,
}: {
  partida: Partida;
  jogadoresForaDaPartida: Jogador[];
}) {
  const router = useRouter();
  const [partida, setPartida] = useState(partidaInicial);
  const [fora, setFora] = useState(foraInicial);
  const [editandoData, setEditandoData] = useState(false);
  const [data, setData] = useState(partida.data);
  const [adicionando, setAdicionando] = useState(false);
  const [novoParticipanteId, setNovoParticipanteId] = useState("");
  const [novoJogadorNome, setNovoJogadorNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [premiacaoFinal, setPremiacaoFinal] = useState<Premiacao | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ativos = partida.lancamentos.filter((l) => l.posicao === null);
  const semPosicao = ativos.length;

  async function executar(url: string, method: string, body?: unknown) {
    setErro(null);
    const resultado = await chamarApi(url, method, body);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return null;
    }
    return resultado.corpo;
  }

  async function salvarData(event: FormEvent) {
    event.preventDefault();
    const corpo = await executar(`/api/partidas/${partida.id}`, "PATCH", { data });
    if (corpo) {
      setPartida(corpo.partida as Partida);
      setEditandoData(false);
    }
  }

  async function adicionarExistente(event: FormEvent) {
    event.preventDefault();
    if (!novoParticipanteId) return;
    const jogadorId = Number(novoParticipanteId);
    const corpo = await executar(`/api/partidas/${partida.id}/participantes`, "POST", {
      jogadorId,
    });
    if (corpo) {
      setPartida(corpo.partida as Partida);
      setFora((atual) => atual.filter((j) => j.id !== jogadorId));
      setNovoParticipanteId("");
    }
  }

  async function cadastrarEAdicionar(event: FormEvent) {
    event.preventDefault();
    const nome = novoJogadorNome.trim();
    if (!nome) return;

    const criado = await executar("/api/jogadores", "POST", { nome });
    if (!criado) return;
    const jogador = criado.jogador as { id: number };

    const corpo = await executar(`/api/partidas/${partida.id}/participantes`, "POST", {
      jogadorId: jogador.id,
    });
    if (corpo) {
      setPartida(corpo.partida as Partida);
      setNovoJogadorNome("");
    }
  }

  async function atualizarLinha(jogadorId: number, dados: AtualizacaoDeLancamento) {
    const corpo = await executar(
      `/api/partidas/${partida.id}/lancamentos/${jogadorId}`,
      "PATCH",
      dados,
    );
    if (corpo) setPartida(corpo.partida as Partida);
  }

  async function marcarSaida(jogadorId: number, eliminadoPorJogadorId: number | null) {
    const corpo = await executar(
      `/api/partidas/${partida.id}/lancamentos/${jogadorId}/sair`,
      "POST",
      { eliminadoPorJogadorId },
    );
    if (corpo) setPartida(corpo.partida as Partida);
  }

  async function finalizar() {
    if (!confirm("Finalizar esta Partida? Depois disso não dá mais pra editar.")) return;
    setEnviando(true);
    const corpo = await executar(`/api/partidas/${partida.id}/finalizar`, "POST");
    setEnviando(false);
    if (corpo) {
      setPremiacaoFinal(corpo.premiacao as Premiacao);
      setPartida(corpo.partida as Partida);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        {editandoData ? (
          <form onSubmit={salvarData} className="flex items-center gap-2">
            <input
              type="date"
              value={data}
              onChange={(event) => setData(event.target.value)}
              className="rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-on-surface"
            />
            <button
              type="submit"
              className="rounded bg-secondary px-3 py-1 text-label-sm text-on-secondary"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setEditandoData(false);
                setData(partida.data);
              }}
              className="text-label-sm text-on-surface-variant"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditandoData(true)}
            className="flex items-center gap-2 text-label-sm text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-sm">edit_calendar</span>
            Editar data
          </button>
        )}
      </div>

      {erro && <p className="text-body-md text-error">{erro}</p>}

      <div className="flex flex-col gap-2">
        <div className="mb-1 flex items-end justify-between">
          <h3 className="text-headline-md text-on-surface">Participantes</h3>
          <span className="rounded-lg bg-surface-container px-3 py-1 text-label-data text-on-surface-variant">
            {partida.lancamentos.length} Total
          </span>
        </div>

        {partida.lancamentos.map((lancamento) => (
          <LinhaDeLancamento
            key={lancamento.jogadorId}
            lancamento={lancamento}
            ativos={ativos}
            todos={partida.lancamentos}
            onAtualizar={atualizarLinha}
            onSair={marcarSaida}
          />
        ))}
      </div>

      {adicionando ? (
        <div className="flex flex-col gap-3 rounded-lg border border-surface-variant bg-surface-container-low p-4">
          <form onSubmit={adicionarExistente} className="flex gap-2">
            <select
              value={novoParticipanteId}
              onChange={(event) => setNovoParticipanteId(event.target.value)}
              className="flex-1 rounded border border-outline-variant bg-surface-container-highest px-3 py-2 text-on-surface"
            >
              <option value="">Jogador já cadastrado...</option>
              {fora.map((jogador) => (
                <option key={jogador.id} value={jogador.id}>
                  {jogador.nome}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!novoParticipanteId}
              className="rounded bg-secondary px-4 py-2 text-label-sm text-on-secondary disabled:opacity-40"
            >
              Adicionar
            </button>
          </form>

          <form onSubmit={cadastrarEAdicionar} className="flex gap-2">
            <input
              type="text"
              placeholder="Nome do novo Jogador"
              value={novoJogadorNome}
              onChange={(event) => setNovoJogadorNome(event.target.value)}
              className="flex-1 rounded border border-outline-variant bg-surface-container-highest px-3 py-2 text-on-surface placeholder-on-surface-variant/50"
            />
            <button
              type="submit"
              disabled={!novoJogadorNome.trim()}
              className="rounded bg-secondary px-4 py-2 text-label-sm text-on-secondary disabled:opacity-40"
            >
              Cadastrar
            </button>
          </form>

          <button
            type="button"
            onClick={() => setAdicionando(false)}
            className="self-start text-label-sm text-on-surface-variant hover:text-on-surface"
          >
            Fechar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdicionando(true)}
          className="flex min-h-touch-target-min w-full items-center justify-center gap-2 rounded-lg border border-secondary text-body-md font-semibold text-secondary transition-colors hover:bg-secondary/10"
        >
          <span className="material-symbols-outlined">person_add</span>
          Adicionar Jogador
        </button>
      )}

      {premiacaoFinal && (
        <p className="text-body-md text-on-surface">
          Premiação: 1º R$ {premiacaoFinal.primeiro.toFixed(2)} · 2º R${" "}
          {premiacaoFinal.segundo.toFixed(2)}
        </p>
      )}

      <button
        type="button"
        onClick={finalizar}
        disabled={enviando || semPosicao > 1}
        className="min-h-touch-target-min w-full rounded-lg bg-secondary font-bold text-on-secondary transition-colors disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-on-surface-variant disabled:opacity-50"
      >
        Finalizar Partida
      </button>
      {semPosicao > 1 && (
        <p className="text-label-sm text-on-surface-variant">
          Faltam {semPosicao} participantes sem posição — só é possível finalizar
          quando restar no máximo 1 (o campeão).
        </p>
      )}
    </div>
  );
}
