import { notFound, redirect } from "next/navigation";
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

  // Partida finalizada não precisa mais de Timer — o jogo já acabou.
  if (partida.finalizada) {
    redirect(`/partidas/${partida.id}`);
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
