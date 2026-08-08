import Link from "next/link";
import { buscarTemporadaAberta } from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
import { RankingsDaTemporada } from "@/components/rankings-da-temporada";

export default async function Home() {
  const temporada = await buscarTemporadaAberta();
  const rankings = temporada
    ? await calcularRankingsDaTemporada(temporada.id)
    : null;
  const todasAsPartidas = temporada ? await listarPartidasDaTemporada(temporada.id) : [];
  // Só Partidas finalizadas aparecem no "Últimas Partidas" pra visitante —
  // uma em andamento ainda pode ter posições incompletas.
  const partidas = todasAsPartidas.filter((p) => p.finalizada);
  // A mais recente ainda rolando — banner no topo, pra quem abre o app
  // sem saber que tem jogo acontecendo agora (ver ticket 34).
  const partidaEmAndamento = todasAsPartidas.find((p) => !p.finalizada) ?? null;

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

      {partidaEmAndamento && (
        <Link
          href={`/partidas/${partidaEmAndamento.id}`}
          className="group mb-section-margin flex items-center gap-4 rounded-xl border border-secondary/30 bg-secondary-container/10 p-4 transition-colors hover:bg-secondary-container/20"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              timer
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
              Partida em andamento
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
            </div>
            <p className="text-label-sm text-on-surface-variant">
              {partidaEmAndamento.data} · {partidaEmAndamento.lancamentos.length} Jogadores
            </p>
          </div>
          <span className="material-symbols-outlined shrink-0 text-secondary transition-transform group-hover:translate-x-1">
            chevron_right
          </span>
        </Link>
      )}

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
