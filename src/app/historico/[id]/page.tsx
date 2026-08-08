import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarTemporadaPorId } from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
import { calcularSaldoDaTemporada } from "@/lib/caixa";
import { RankingsDaTemporada } from "@/components/rankings-da-temporada";

function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${dia} ${meses[Number(mes) - 1]} ${ano}`;
}

function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function TemporadaHistoricaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const temporada = await buscarTemporadaPorId(Number(id));
  // A Temporada aberta vive em `/` — aqui só faz sentido uma encerrada
  // (é o que `/historico` sempre linka), então trata a aberta como
  // "não encontrada" pra esta página.
  if (!temporada || temporada.aberta) {
    notFound();
  }

  const [rankings, partidasDaTemporada, saldoDoCaixa] = await Promise.all([
    calcularRankingsDaTemporada(temporada.id),
    listarPartidasDaTemporada(temporada.id),
    calcularSaldoDaTemporada(temporada.id),
  ]);
  const partidas = partidasDaTemporada.filter((p) => p.finalizada);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-headline-lg text-on-surface">
            Temporada {formatarData(temporada.dataInicio)}
          </h1>
          <span className="rounded border border-outline-variant/30 bg-surface-variant px-2 py-0.5 text-label-sm uppercase tracking-wide text-tertiary">
            Encerrada
          </span>
        </div>
        <p className="flex items-center gap-1 text-label-data text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          {formatarData(temporada.dataInicio)}
          {temporada.dataFim ? ` – ${formatarData(temporada.dataFim)}` : ""}
        </p>
      </div>

      {/* Aviso só pra Temporada 2026.1, importada de `POKER 1_2026.xlsx`
          (ticket 24) — a planilha não registrava quem eliminou quem, só o
          total de Almas por Jogador/Partida, então o "eliminado por" de
          cada Lançamento aqui foi reconstruído (consistente nos totais,
          mas não é a ordem real daquela noite). Checagem por data em vez
          de um campo novo no banco — é histórico, não deve se repetir. */}
      {temporada.dataInicio.startsWith("2026-02-03") && (
        <div className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-secondary-container/10 p-4 text-body-md text-on-surface-variant">
          <span className="material-symbols-outlined mt-0.5 text-secondary">info</span>
          <p>
            Temporada importada de uma planilha antiga. Posições e Pontos são
            os reais. A planilha não registrava quem eliminou quem — só o
            total de Almas de cada Jogador — então o &quot;eliminado por&quot;
            de cada Partida aqui foi <strong>reconstruído</strong> pra
            fechar os totais de Almas certinhos; não reflete a ordem real
            das eliminações daquela noite.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-stack-gap">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low p-4 text-center">
          <span className="material-symbols-outlined text-primary">playing_cards</span>
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Total de Partidas
          </span>
          <span className="text-body-lg font-bold text-on-surface">{partidas.length}</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low p-4 text-center">
          <span className="material-symbols-outlined text-primary">payments</span>
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Saldo do Caixa
          </span>
          <span className="text-body-lg font-bold text-secondary">
            R$ {formatarValor(saldoDoCaixa)}
          </span>
        </div>
      </div>

      <RankingsDaTemporada
        rankingDePontuacao={rankings?.rankingDePontuacao ?? []}
        rankingCarrasco={rankings?.rankingCarrasco ?? []}
        partidas={partidas.map((p) => ({
          id: p.id,
          data: p.data,
          participantes: p.lancamentos.length,
        }))}
      />

      <Link href="/historico" className="text-center text-primary hover:underline">
        ← Todas as Temporadas anteriores
      </Link>
    </main>
  );
}
