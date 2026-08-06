import Link from "next/link";
import { listarTemporadasEncerradas } from "@/lib/temporadas";

export default async function HistoricoPage() {
  const temporadas = await listarTemporadasEncerradas();

  return (
    <main style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <h1>Temporadas anteriores</h1>
      {temporadas.length === 0 ? (
        <p>Nenhuma Temporada encerrada ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {temporadas.map((temporada) => (
            <li key={temporada.id} style={{ marginBottom: "0.5rem" }}>
              <Link href={`/historico/${temporada.id}`}>
                {temporada.dataInicio.slice(0, 10)} até{" "}
                {temporada.dataFim?.slice(0, 10)}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link href="/">← Temporada atual</Link>
      </p>
    </main>
  );
}
