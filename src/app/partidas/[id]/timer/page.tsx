import { notFound } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { buscarPartidaPorId, partidaEstaEditavelPeloOrganizador } from "@/lib/partidas";
import { buscarTemporadaPorId } from "@/lib/temporadas";
import { TimerTelaCheiaClient } from "./timer-tela-cheia-client";

export default async function TimerTelaCheiaPage({
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
  const podeControlar = partidaEstaEditavelPeloOrganizador(
    partida,
    Boolean(temporada?.aberta),
    Boolean(organizador),
  );

  return <TimerTelaCheiaClient partidaId={partida.id} podeControlar={podeControlar} />;
}
