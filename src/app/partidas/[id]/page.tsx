import { notFound } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import {
  buscarPartidaPorId,
  partidaEstaEditavelPeloOrganizador,
  type LancamentoDaPartida,
} from "@/lib/partidas";
import { buscarTemporadaPorId } from "@/lib/temporadas";
import { listarJogadoresAtivos } from "@/lib/jogadores";
import { PartidaEmAndamentoClient } from "./partida-em-andamento-client";
import { TimerClient } from "./timer-client";

function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase();
}

/** Cor do badge de posição — 1º e 2º (premiados) se destacam dos demais. */
function corDoBadge(posicao: number | null): string {
  if (posicao === 1) return "bg-secondary/10 text-secondary border-secondary/30";
  if (posicao === 2) return "bg-tertiary/10 text-tertiary border-tertiary/30";
  return "bg-surface-container-highest text-on-surface-variant border-transparent";
}

function ResultadoDaPartida({ lancamentos }: { lancamentos: LancamentoDaPartida[] }) {
  const ordenados = [...lancamentos].sort((a, b) => {
    if (a.posicao === null) return 1;
    if (b.posicao === null) return -1;
    return a.posicao - b.posicao;
  });

  return (
    <div className="flex flex-col gap-2">
      {ordenados.map((lancamento) => (
        <div
          key={lancamento.jogadorId}
          className="flex items-center gap-4 rounded-lg border border-surface-container-high bg-surface-container-low p-3"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-label-data font-bold ${corDoBadge(lancamento.posicao)}`}
          >
            {lancamento.posicao ?? "—"}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-body-md font-bold text-on-surface">
            {inicial(lancamento.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body-md font-semibold text-on-surface">
              {lancamento.nome}
            </div>
            {lancamento.eliminadoPorNome && (
              <div className="truncate text-xs text-on-surface-variant">
                Eliminado por: {lancamento.eliminadoPorNome}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <div className="text-label-data font-bold text-on-surface">
              {lancamento.pontos ?? "—"} pts
            </div>
            <div className="flex items-center gap-1 text-xs text-error">
              <span className="material-symbols-outlined text-[14px]">skull</span>
              {lancamento.almas}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function PartidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partida = await buscarPartidaPorId(Number(id));
  if (!partida) {
    notFound();
  }

  const organizador = await getOrganizadorLogado();
  const temporada = await buscarTemporadaPorId(partida.temporadaId);
  const podeEditar = partidaEstaEditavelPeloOrganizador(
    partida,
    Boolean(temporada?.aberta),
    Boolean(organizador),
  );

  const jogadoresForaDaPartida = podeEditar
    ? (await listarJogadoresAtivos()).filter(
        (j) => !partida.lancamentos.some((l) => l.jogadorId === j.id),
      )
    : [];

  return (
    <main className="px-container-padding py-6">
      <div className="mb-section-margin flex flex-col items-center gap-1 text-center">
        <h1 className="text-headline-md text-on-surface">Partida</h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-label-data text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          {partida.data}
          {!partida.finalizada && (
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
              Em andamento
            </span>
          )}
        </div>
      </div>

      {/* Partida finalizada não precisa mais de Timer — o jogo já acabou. */}
      {!partida.finalizada && <TimerClient partidaId={partida.id} podeControlar={podeEditar} />}

      {podeEditar ? (
        <PartidaEmAndamentoClient
          partida={partida}
          jogadoresForaDaPartida={jogadoresForaDaPartida}
        />
      ) : (
        <ResultadoDaPartida lancamentos={partida.lancamentos} />
      )}
    </main>
  );
}
