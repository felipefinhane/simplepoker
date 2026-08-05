import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { listarJogadores } from "@/lib/jogadores";
import { JogadoresClient } from "./jogadores-client";

export default async function JogadoresPage() {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const jogadores = await listarJogadores();

  return (
    <main style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <h1>Jogadores</h1>
      <JogadoresClient jogadoresIniciais={jogadores} />
    </main>
  );
}
