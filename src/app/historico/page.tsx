import Link from "next/link";
import { listarTemporadasEncerradas } from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
import { calcularSaldoDaTemporada } from "@/lib/caixa";

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

export default async function HistoricoPage() {
  const temporadas = await listarTemporadasEncerradas();

  const cards = await Promise.all(
    temporadas.map(async (temporada) => {
      const partidas = (await listarPartidasDaTemporada(temporada.id)).filter(
        (p) => p.finalizada,
      );
      const [rankings, saldoDoCaixa] = await Promise.all([
        calcularRankingsDaTemporada(temporada.id),
        calcularSaldoDaTemporada(temporada.id),
      ]);
      const campeao = rankings?.rankingDePontuacao[0]?.nome ?? null;
      return { temporada, totalPartidas: partidas.length, campeao, saldoDoCaixa };
    }),
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Histórico de Temporadas</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Revise os resultados e campeões de Temporadas passadas.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
          Nenhuma Temporada encerrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-stack-gap">
          {cards.map(({ temporada, totalPartidas, campeao, saldoDoCaixa }) => (
            <Link
              key={temporada.id}
              href={`/historico/${temporada.id}`}
              className="group relative overflow-hidden rounded-xl border border-surface-container-high bg-gradient-to-br from-surface-container-low to-surface p-5 shadow-lg transition-colors hover:border-secondary/40"
            >
              <span
                className="material-symbols-outlined pointer-events-none absolute -right-6 -top-6 select-none text-[130px] text-surface-container-high opacity-30 transition-transform duration-500 group-hover:scale-110"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trophy
              </span>

              <div className="relative z-10 mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-headline-md text-on-surface">
                      Temporada {formatarData(temporada.dataInicio)}
                    </h2>
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
                <span className="material-symbols-outlined text-outline transition-colors group-hover:text-secondary">
                  chevron_right
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4 rounded-lg border border-surface-container bg-surface-container-low p-4 sm:flex-row sm:justify-between">
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-container to-secondary text-on-secondary shadow-[0_0_10px_rgba(233,195,73,0.3)]">
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      emoji_events
                    </span>
                  </div>
                  <div>
                    <p className="mb-0.5 text-label-sm uppercase tracking-widest text-secondary">
                      Campeão
                    </p>
                    <p className="text-body-lg font-semibold text-on-surface">{campeao ?? "—"}</p>
                  </div>
                </div>

                <div className="hidden h-10 w-px bg-outline-variant sm:block" />

                <div className="flex w-full justify-between gap-6 border-t border-outline-variant pt-4 sm:w-auto sm:justify-start sm:border-t-0 sm:pt-0">
                  <div>
                    <p className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Partidas
                    </p>
                    <p className="text-lg text-label-data text-on-surface">{totalPartidas}</p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Saldo do Caixa
                    </p>
                    <p className="text-lg text-label-data text-secondary">
                      R$ {formatarValor(saldoDoCaixa)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href="/" className="text-center text-primary hover:underline">
        ← Temporada atual
      </Link>
    </main>
  );
}
