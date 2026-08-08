import Link from "next/link";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { buscarTemporadaAberta } from "@/lib/temporadas";

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${dia} ${meses[Number(mes) - 1]} ${ano}`;
}

/**
 * Lista de Partidas — pública (qualquer visitante vê data, participantes e
 * status), com "+ Nova Partida" visível só pro Organizador logado. Mesmo
 * padrão dual-modo do detalhe de uma Partida (`/partidas/[id]`, ticket 07).
 *
 * Só mostra as Partidas da Temporada **aberta** — Partidas de Temporadas
 * encerradas (ex: a importada no ticket 24) só aparecem dentro do
 * Histórico daquela Temporada (`/historico/[id]`), não misturadas aqui.
 */
export default async function PartidasPage() {
  const [organizador, temporadaAberta] = await Promise.all([
    getOrganizadorLogado(),
    buscarTemporadaAberta(),
  ]);
  const partidas = temporadaAberta ? await listarPartidasDaTemporada(temporadaAberta.id) : [];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">Partidas</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Histórico e Partidas em andamento da Temporada atual.
          </p>
        </div>
        {organizador && temporadaAberta && (
          <Link
            href="/partidas/nova"
            className="flex h-touch-target-min shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-label-sm font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-fixed"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nova
          </Link>
        )}
      </div>

      {!temporadaAberta && (
        <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
          Nenhuma Temporada aberta no momento. Partidas de Temporadas
          encerradas ficam no{" "}
          <Link href="/historico" className="text-primary hover:underline">
            Histórico
          </Link>
          .
        </p>
      )}

      <div className="flex flex-col gap-2">
        {partidas.map((partida) => (
          <Link
            key={partida.id}
            href={`/partidas/${partida.id}`}
            className="group flex items-center justify-between gap-4 rounded-lg border border-surface-container-high bg-surface-container-low p-4 transition-colors hover:border-outline-variant hover:bg-surface-container"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant">
                <span className="material-symbols-outlined">playing_cards</span>
              </div>
              <div>
                <div className="text-body-md font-semibold text-on-surface transition-colors group-hover:text-primary">
                  {formatarData(partida.data)}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">groups</span>
                    {partida.lancamentos.length} Jogadores
                  </span>
                  {!partida.finalizada && (
                    <span className="flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary-container/20 px-2 py-0.5 text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                      Em andamento
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant transition-colors group-hover:text-primary">
              chevron_right
            </span>
          </Link>
        ))}

        {temporadaAberta && partidas.length === 0 && (
          <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
            Nenhuma Partida ainda.
          </p>
        )}
      </div>
    </main>
  );
}
