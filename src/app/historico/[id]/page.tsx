import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarTemporadaPorId } from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
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

  const rankings = await calcularRankingsDaTemporada(temporada.id);
  const partidas = (await listarPartidasDaTemporada(temporada.id)).filter(
    (p) => p.finalizada,
  );
  const totalArrecadado = partidas.reduce(
    (soma, p) => soma + p.lancamentos.length * temporada.parametros.valorDaPartida,
    0,
  );

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
            Total Arrecadado
          </span>
          <span className="text-body-lg font-bold text-secondary">
            R$ {formatarValor(totalArrecadado)}
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
