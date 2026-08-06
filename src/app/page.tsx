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
  // Só Partidas finalizadas aparecem pra visitante — uma em andamento
  // ainda pode ter posições incompletas.
  const partidas = temporada
    ? (await listarPartidasDaTemporada(temporada.id)).filter((p) => p.finalizada)
    : [];

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem" }}>
      <h1>Simplepoker</h1>
      <p style={{ opacity: 0.7 }}>
        Ranking, resultados e caixa do campeonato de poker semanal do grupo.
      </p>

      {!temporada || !rankings ? (
        <p>Nenhuma Temporada aberta no momento.</p>
      ) : (
        <RankingsDaTemporada
          rankingDePontuacao={rankings.rankingDePontuacao}
          rankingCarrasco={rankings.rankingCarrasco}
          partidas={partidas}
        />
      )}

      <p style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Link href="/caixa">Caixa</Link>
        <Link href="/historico">Temporadas anteriores</Link>
      </p>
    </main>
  );
}
