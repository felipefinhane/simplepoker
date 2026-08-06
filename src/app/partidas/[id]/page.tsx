import { notFound } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { buscarPartidaPorId } from "@/lib/partidas";
import { buscarTemporadaPorId } from "@/lib/temporadas";
import { listarJogadoresAtivos } from "@/lib/jogadores";
import { PartidaEmAndamentoClient } from "./partida-em-andamento-client";
import { TimerClient } from "./timer-client";

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
  const podeEditar =
    Boolean(organizador) && Boolean(temporada?.aberta) && !partida.finalizada;

  const jogadoresForaDaPartida = podeEditar
    ? (await listarJogadoresAtivos()).filter(
        (j) => !partida.lancamentos.some((l) => l.jogadorId === j.id),
      )
    : [];

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem" }}>
      <h1>Partida — {partida.data}</h1>
      {!partida.finalizada && (
        <p style={{ opacity: 0.7, margin: "0 0 1rem" }}>Em andamento</p>
      )}

      <TimerClient partidaId={partida.id} podeControlar={podeEditar} />

      {podeEditar ? (
        <PartidaEmAndamentoClient
          partida={partida}
          jogadoresForaDaPartida={jogadoresForaDaPartida}
        />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Jogador</th>
                <th>Posição</th>
                <th>Eliminado por</th>
                <th>Almas</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {partida.lancamentos.map((lancamento) => (
                <tr key={lancamento.jogadorId}>
                  <td>{lancamento.nome}</td>
                  <td style={{ textAlign: "center" }}>
                    {lancamento.posicao ?? "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {lancamento.eliminadoPorNome ?? "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>{lancamento.almas}</td>
                  <td style={{ textAlign: "center" }}>
                    {lancamento.pontos ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
