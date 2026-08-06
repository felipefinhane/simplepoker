import { notFound, redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { buscarPartidaPorId } from "@/lib/partidas";
import { LancamentoClient } from "./lancamento-client";

export default async function PartidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const { id } = await params;
  const partida = await buscarPartidaPorId(Number(id));
  if (!partida) {
    notFound();
  }

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem" }}>
      <h1>Partida — {partida.data}</h1>
      <LancamentoClient partida={partida} />
    </main>
  );
}
