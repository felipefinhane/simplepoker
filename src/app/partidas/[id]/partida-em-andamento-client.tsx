"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconeCarregando } from "@/components/icone-carregando";
import { ModalGerenciarJogadores } from "@/components/modal-gerenciar-jogadores";
import type { AtualizacaoDeLancamento, LancamentoDaPartida, Partida } from "@/lib/partidas";
import type { Jogador } from "@/lib/jogadores";
import type { ProjecaoDeRanking, ProjecoesPorJogador } from "@/lib/rankings";

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

/** Espelha `MINIMO_DE_PARTICIPANTES` de `@/lib/partidas` — mesmo padrão de
 * `nova-partida-client.tsx` (evita puxar código de servidor pro bundle do
 * cliente só por causa de uma constante). */
const MINIMO_DE_PARTICIPANTES = 5;

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
  salvando,
  onAtualizar,
  onSair,
  onRemover,
  naoRemovivelPorque,
  projecao,
}: {
  lancamento: LancamentoDaPartida;
  /** Só os ainda ativos — opções válidas pro fluxo rápido "Saiu". */
  ativos: LancamentoDaPartida[];
  /** Todo mundo — o editor manual aceita qualquer Jogador como eliminador. */
  todos: LancamentoDaPartida[];
  /** Essa linha tem um PATCH/DELETE em andamento (ver `salvandoJogadorId` no pai). */
  salvando: boolean;
  onAtualizar: (jogadorId: number, dados: AtualizacaoDeLancamento) => Promise<void>;
  onSair: (jogadorId: number, eliminadoPorJogadorId: number | null) => Promise<void>;
  onRemover: (jogadorId: number) => Promise<void>;
  /** `null` = pode remover; senão, o motivo do bloqueio (mostrado no
   * `title` do botão) — já eliminou alguém, ou cairia abaixo do mínimo. */
  naoRemovivelPorque: string | null;
  /** Ticket 50 — só existe pra quem já saiu (tem Posição definida). */
  projecao?: ProjecaoDeRanking;
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
          {projecao && (
            <div className="mt-0.5 text-[11px] text-on-surface-variant">
              → {projecao.totalProjetado} pts na Temporada
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-label-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={lancamento.pagamento}
            disabled={salvando}
            onChange={(event) =>
              onAtualizar(lancamento.jogadorId, { pagamento: event.target.checked })
            }
            className="h-4 w-4 rounded border-outline-variant bg-surface-container-highest text-secondary disabled:opacity-50"
          />
          Pagou
          {salvando && <IconeCarregando tamanho={14} />}
        </label>

        <div className="ml-auto flex items-center gap-2">
          {!estaAtivo && (
            <button
              type="button"
              disabled={salvando}
              onClick={() =>
                onAtualizar(lancamento.jogadorId, { posicao: null, eliminadoPorJogadorId: null })
              }
              className="flex items-center gap-1 rounded border border-outline-variant px-3 py-2 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
            >
              {salvando ? <IconeCarregando tamanho={16} /> : (
                <span className="material-symbols-outlined text-[16px]">undo</span>
              )}
              Desfazer
            </button>
          )}

          {estaAtivo && !saindo && (
            <button
              type="button"
              disabled={salvando || naoRemovivelPorque !== null}
              title={naoRemovivelPorque ?? undefined}
              aria-label={`Remover ${lancamento.nome} da Partida`}
              onClick={() => {
                if (confirm(`Remover ${lancamento.nome} desta Partida? Ele não vai jogar.`)) {
                  onRemover(lancamento.jogadorId);
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-error disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">person_remove</span>
            </button>
          )}

          {estaAtivo &&
            (saindo ? (
              <>
                <select
                  value={eliminadorEscolhido}
                  disabled={salvando}
                  onChange={(event) => setEliminadorEscolhido(event.target.value)}
                  className="rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-label-sm text-on-surface disabled:opacity-50"
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
                  disabled={salvando}
                  onClick={async () => {
                    // Só fecha o fluxo "Saiu" depois que o pedido de
                    // verdade terminar — fechar na hora (como era antes)
                    // faz o botão "Saiu" reaparecer enquanto ainda está
                    // salvando, parecendo que dava pra clicar de novo.
                    await onSair(
                      lancamento.jogadorId,
                      eliminadorEscolhido ? Number(eliminadorEscolhido) : null,
                    );
                    setSaindo(false);
                    setEliminadorEscolhido("");
                  }}
                  className="flex items-center gap-1 rounded border border-secondary/30 bg-secondary/10 px-3 py-1 text-label-sm text-secondary disabled:opacity-50"
                >
                  {salvando && <IconeCarregando tamanho={14} />}
                  Confirmar
                </button>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => setSaindo(false)}
                  className="text-label-sm text-on-surface-variant disabled:opacity-50"
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
              disabled={salvando}
              defaultValue={lancamento.posicao ?? ""}
              onBlur={(event) => {
                const valor = event.target.value;
                const posicao = valor === "" ? null : Number(valor);
                if (posicao !== lancamento.posicao) {
                  onAtualizar(lancamento.jogadorId, { posicao });
                }
              }}
              className="w-16 rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-on-surface disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            Eliminado por
            <select
              value={lancamento.eliminadoPorJogadorId ?? ""}
              disabled={salvando}
              onChange={(event) =>
                onAtualizar(lancamento.jogadorId, {
                  eliminadoPorJogadorId: event.target.value ? Number(event.target.value) : null,
                })
              }
              className="rounded border border-outline-variant bg-surface-container-highest px-2 py-1 text-on-surface disabled:opacity-50"
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
  projecoes,
}: {
  partida: Partida;
  jogadoresForaDaPartida: Jogador[];
  /** Ticket 50, recalculada a cada `router.refresh()` (ticket 52) — server-side, não aqui. */
  projecoes: ProjecoesPorJogador;
}) {
  const router = useRouter();
  const [partida, setPartida] = useState(partidaInicial);
  const [fora, setFora] = useState<{ id: number; nome: string }[]>(foraInicial);

  // Resync durante a renderização (não num efeito — padrão recomendado
  // pelo próprio React pra "ajustar estado quando um prop muda", evita o
  // vai-e-volta de um efeito chamando setState): `useState(partidaInicial)`
  // só usa o valor inicial no primeiro mount, então sem isso o refresh
  // automático (ticket 52, `router.refresh()` no pai) atualizaria os props
  // do Server Component mas essa cópia local ficaria parada no que já
  // tinha ao montar. Mesma lógica pra `fora`.
  const [partidaAnterior, setPartidaAnterior] = useState(partidaInicial);
  if (partidaInicial !== partidaAnterior) {
    setPartidaAnterior(partidaInicial);
    setPartida(partidaInicial);
  }
  const [foraAnterior, setForaAnterior] = useState(foraInicial);
  if (foraInicial !== foraAnterior) {
    setForaAnterior(foraInicial);
    setFora(foraInicial);
  }
  const [editandoData, setEditandoData] = useState(false);
  const [data, setData] = useState(partida.data);
  const [adicionando, setAdicionando] = useState(false);
  const [gerenciandoJogadores, setGerenciandoJogadores] = useState(false);
  const [novoParticipanteId, setNovoParticipanteId] = useState("");
  const [novoJogadorNome, setNovoJogadorNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [premiacaoFinal, setPremiacaoFinal] = useState<Premiacao | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [salvandoData, setSalvandoData] = useState(false);
  const [enviandoParticipante, setEnviandoParticipante] = useState(false);
  const [cadastrandoJogador, setCadastrandoJogador] = useState(false);
  // Qual linha de Jogador tem um PATCH/POST em andamento (Pagou, Desfazer,
  // Saiu, editor manual) — ver `LinhaDeLancamento`.
  const [salvandoJogadorId, setSalvandoJogadorId] = useState<number | null>(null);

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
    setSalvandoData(true);
    try {
      const corpo = await executar(`/api/partidas/${partida.id}`, "PATCH", { data });
      if (corpo) {
        setPartida(corpo.partida as Partida);
        setEditandoData(false);
      }
    } finally {
      setSalvandoData(false);
    }
  }

  async function adicionarExistente(event: FormEvent) {
    event.preventDefault();
    if (!novoParticipanteId) return;
    const jogadorId = Number(novoParticipanteId);
    setEnviandoParticipante(true);
    try {
      const corpo = await executar(`/api/partidas/${partida.id}/participantes`, "POST", {
        jogadorId,
      });
      if (corpo) {
        setPartida(corpo.partida as Partida);
        setFora((atual) => atual.filter((j) => j.id !== jogadorId));
        setNovoParticipanteId("");
      }
    } finally {
      setEnviandoParticipante(false);
    }
  }

  async function cadastrarEAdicionar(event: FormEvent) {
    event.preventDefault();
    const nome = novoJogadorNome.trim();
    if (!nome) return;
    setCadastrandoJogador(true);

    try {
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
    } finally {
      setCadastrandoJogador(false);
    }
  }

  async function atualizarLinha(jogadorId: number, dados: AtualizacaoDeLancamento) {
    setSalvandoJogadorId(jogadorId);
    try {
      const corpo = await executar(
        `/api/partidas/${partida.id}/lancamentos/${jogadorId}`,
        "PATCH",
        dados,
      );
      if (corpo) setPartida(corpo.partida as Partida);
    } finally {
      setSalvandoJogadorId(null);
    }
  }

  async function removerLinha(jogadorId: number) {
    setSalvandoJogadorId(jogadorId);
    try {
      const removido = partida.lancamentos.find((l) => l.jogadorId === jogadorId);
      const corpo = await executar(
        `/api/partidas/${partida.id}/participantes/${jogadorId}`,
        "DELETE",
      );
      if (corpo) {
        setPartida(corpo.partida as Partida);
        // Removido volta a aparecer no seletor "Adicionar Jogador" — mesma
        // lista de quem tá de fora da Partida.
        if (removido) setFora((atual) => [...atual, { id: removido.jogadorId, nome: removido.nome }]);
      }
    } finally {
      setSalvandoJogadorId(null);
    }
  }

  async function marcarSaida(jogadorId: number, eliminadoPorJogadorId: number | null) {
    setSalvandoJogadorId(jogadorId);
    try {
      const corpo = await executar(
        `/api/partidas/${partida.id}/lancamentos/${jogadorId}/sair`,
        "POST",
        { eliminadoPorJogadorId },
      );
      if (corpo) setPartida(corpo.partida as Partida);
    } finally {
      setSalvandoJogadorId(null);
    }
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
              disabled={salvandoData}
              className="flex items-center gap-2 rounded bg-secondary px-3 py-1 text-label-sm text-on-secondary disabled:opacity-60"
            >
              {salvandoData && <IconeCarregando tamanho={14} />}
              Salvar
            </button>
            <button
              type="button"
              disabled={salvandoData}
              onClick={() => {
                setEditandoData(false);
                setData(partida.data);
              }}
              className="text-label-sm text-on-surface-variant disabled:opacity-60"
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
        <div className="mb-1 flex items-end justify-between gap-2">
          <h3 className="text-headline-md text-on-surface">Participantes</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGerenciandoJogadores(true)}
              className="flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              Gerenciar
            </button>
            <span className="rounded-lg bg-surface-container px-3 py-1 text-label-data text-on-surface-variant">
              {partida.lancamentos.length} Total
            </span>
          </div>
        </div>

        {partida.lancamentos.map((lancamento) => (
          <LinhaDeLancamento
            key={lancamento.jogadorId}
            lancamento={lancamento}
            ativos={ativos}
            todos={partida.lancamentos}
            salvando={salvandoJogadorId === lancamento.jogadorId}
            onAtualizar={atualizarLinha}
            onSair={marcarSaida}
            onRemover={removerLinha}
            naoRemovivelPorque={
              lancamento.almas > 0
                ? "Já eliminou alguém nesta Partida — não pode ser removido."
                : partida.lancamentos.length <= MINIMO_DE_PARTICIPANTES
                  ? `Mínimo de ${MINIMO_DE_PARTICIPANTES} participantes.`
                  : null
            }
            projecao={projecoes[lancamento.jogadorId]}
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
              disabled={!novoParticipanteId || enviandoParticipante}
              className="flex items-center gap-2 rounded bg-secondary px-4 py-2 text-label-sm text-on-secondary disabled:opacity-40"
            >
              {enviandoParticipante && <IconeCarregando tamanho={16} />}
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
              disabled={!novoJogadorNome.trim() || cadastrandoJogador}
              className="flex items-center gap-2 rounded bg-secondary px-4 py-2 text-label-sm text-on-secondary disabled:opacity-40"
            >
              {cadastrandoJogador && <IconeCarregando tamanho={16} />}
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
        className="flex min-h-touch-target-min w-full items-center justify-center gap-2 rounded-lg bg-secondary font-bold text-on-secondary transition-colors disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-on-surface-variant disabled:opacity-50"
      >
        {enviando && <IconeCarregando />}
        Finalizar Partida
      </button>
      {semPosicao > 1 && (
        <p className="text-label-sm text-on-surface-variant">
          Faltam {semPosicao} participantes sem posição — só é possível finalizar
          quando restar no máximo 1 (o campeão).
        </p>
      )}

      <ModalGerenciarJogadores
        aberto={gerenciandoJogadores}
        onFechar={() => setGerenciandoJogadores(false)}
        onAtualizarAtivos={(ativos) => {
          // Só sobra quem tá ativo e ainda não é participante desta
          // Partida — quem já entrou continua na lista de Participantes
          // acima independente do toggle (desativar não remove ninguém
          // de uma Partida já em andamento, só evita novas seleções).
          const jaParticipam = new Set(partida.lancamentos.map((l) => l.jogadorId));
          setFora(ativos.filter((j) => !jaParticipam.has(j.id)));
        }}
      />
    </div>
  );
}
