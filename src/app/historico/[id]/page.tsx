import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarTemporadaPorId } from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
import { RankingsDaTemporada } from "@/components/rankings-da-temporada";

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

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem" }}>
      <h1>
        Temporada — {temporada.dataInicio.slice(0, 10)} até{" "}
        {temporada.dataFim?.slice(0, 10)}
      </h1>

      <RankingsDaTemporada
        rankingDePontuacao={rankings?.rankingDePontuacao ?? []}
        rankingCarrasco={rankings?.rankingCarrasco ?? []}
        partidas={partidas}
      />

      <p style={{ marginTop: "2rem" }}>
        <Link href="/historico">← Todas as Temporadas anteriores</Link>
      </p>
    </main>
  );
}
