import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { listarPartidas } from "@/lib/partidas";

export default async function PartidasPage() {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const partidas = await listarPartidas();

  return (
    <main style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <h1>Partidas</h1>
      <p>
        <Link href="/partidas/nova">+ Nova Partida</Link>
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {partidas.map((partida) => {
          const lancada = partida.lancamentos.every((r) => r.posicao !== null);
          return (
            <li key={partida.id} style={{ marginBottom: "0.5rem" }}>
              <Link href={`/partidas/${partida.id}`}>
                {partida.data} — {partida.lancamentos.length} participantes
                {lancada ? "" : " (resultado pendente)"}
              </Link>
            </li>
          );
        })}
        {partidas.length === 0 && <li>Nenhuma Partida ainda.</li>}
      </ul>
    </main>
  );
}
