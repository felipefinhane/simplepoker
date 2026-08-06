import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { listarJogadoresAtivos } from "@/lib/jogadores";
import { NovaPartidaClient } from "./nova-partida-client";

export default async function NovaPartidaPage() {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const jogadoresAtivos = await listarJogadoresAtivos();

  return (
    <main style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <h1>Nova Partida</h1>
      <NovaPartidaClient jogadoresAtivos={jogadoresAtivos} />
    </main>
  );
}
