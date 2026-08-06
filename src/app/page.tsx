import { buscarTemporadaAberta } from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
import { RankingsDaTemporada } from "@/components/rankings-da-temporada";

export default async function Home() {
  const temporada = await buscarTemporadaAberta();
  const rankings = temporada
    ? await calcularRankingsDaTemporada(temporada.id)
    : null;
  // Só Partidas finalizadas aparecem pra visitante — uma em andamento
  // ainda pode ter posições incompletas.
  const partidas = temporada
    ? (await listarPartidasDaTemporada(temporada.id)).filter((p) => p.finalizada)
    : [];

  return (
    <main className="px-container-padding py-6">
      <div className="mb-section-margin">
        <h1 className="mb-2 text-headline-lg text-on-surface">Ranking da Temporada</h1>
        {temporada && (
          <div className="inline-flex items-center rounded-full border border-primary-container bg-primary-container/20 px-3 py-1 text-label-data text-primary">
            <span className="material-symbols-outlined mr-1 text-[16px]">calendar_today</span>
            Temporada aberta desde {temporada.dataInicio.slice(0, 10)}
          </div>
        )}
      </div>

      {!temporada || !rankings ? (
        <p className="text-body-md text-on-surface-variant">
          Nenhuma Temporada aberta no momento.
        </p>
      ) : (
        <RankingsDaTemporada
          rankingDePontuacao={rankings.rankingDePontuacao}
          rankingCarrasco={rankings.rankingCarrasco}
          partidas={partidas.map((p) => ({
            id: p.id,
            data: p.data,
            participantes: p.lancamentos.length,
          }))}
        />
      )}
    </main>
  );
}
