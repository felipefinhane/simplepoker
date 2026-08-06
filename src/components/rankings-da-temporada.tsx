import Link from "next/link";
import type { EntradaDeRanking } from "@/lib/rankings";

interface PartidaResumo {
  id: number;
  data: string;
}

function TabelaDeRanking({
  titulo,
  entradas,
  destaque,
}: {
  titulo: string;
  entradas: EntradaDeRanking[];
  destaque: "totalPontos" | "totalAlmas";
}) {
  // O Ranking Carrasco (destaque="totalAlmas") só mostra Almas — é um
  // ranking à parte do de Pontuação, então a coluna de Pontos aqui só
  // desviaria a atenção do que ele responde ("quem mais eliminou gente").
  const mostrarPontos = destaque === "totalPontos";

  return (
    <div>
      <h2>{titulo}</h2>
      {entradas.length === 0 ? (
        <p>Nenhuma Partida lançada ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>#</th>
                <th style={{ textAlign: "left" }}>Jogador</th>
                {mostrarPontos && <th>Pontos</th>}
                <th>Almas</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((entrada, indice) => (
                <tr
                  key={entrada.jogadorId}
                  style={{
                    fontWeight: indice === 0 ? "bold" : "normal",
                  }}
                >
                  <td>{indice + 1}º</td>
                  <td>{entrada.nome}</td>
                  {mostrarPontos && (
                    <td style={{ textAlign: "center" }}>
                      <strong>{entrada.totalPontos}</strong>
                    </td>
                  )}
                  <td style={{ textAlign: "center" }}>
                    {destaque === "totalAlmas" ? (
                      <strong>{entrada.totalAlmas}</strong>
                    ) : (
                      entrada.totalAlmas
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RankingsDaTemporada({
  rankingDePontuacao,
  rankingCarrasco,
  partidas,
}: {
  rankingDePontuacao: EntradaDeRanking[];
  rankingCarrasco: EntradaDeRanking[];
  partidas: PartidaResumo[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "2rem",
        }}
      >
        <TabelaDeRanking
          titulo="Ranking de Pontuação"
          entradas={rankingDePontuacao}
          destaque="totalPontos"
        />
        <TabelaDeRanking
          titulo="Ranking Carrasco"
          entradas={rankingCarrasco}
          destaque="totalAlmas"
        />
      </div>

      <div>
        <h2>Partidas</h2>
        {partidas.length === 0 ? (
          <p>Nenhuma Partida ainda.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {partidas.map((partida) => (
              <li key={partida.id} style={{ marginBottom: "0.35rem" }}>
                <Link href={`/partidas/${partida.id}`}>{partida.data}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
