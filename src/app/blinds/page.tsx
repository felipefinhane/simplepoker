import Link from "next/link";
import { buscarTemporadaAberta } from "@/lib/temporadas";

function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function formatarDuracaoAcumulada(minutosTotais: number): string {
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  if (horas === 0) return `${minutos}min`;
  return `${horas}h${minutos > 0 ? `${minutos.toString().padStart(2, "0")}` : ""}`;
}

/**
 * Estrutura de Blinds da Temporada atual — visualização pública e estática
 * (não é o Timer ao vivo de uma Partida, ticket 09/14; é só a tabela de
 * referência configurada nos Parâmetros da Temporada, ticket 05).
 */
export default async function BlindsPage() {
  const temporada = await buscarTemporadaAberta();
  const niveis = temporada?.parametros.estruturaDeBlinds ?? [];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Estrutura de Blinds</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Níveis de blind e duração configurados para a Temporada atual.
        </p>
      </div>

      {!temporada && (
        <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
          Nenhuma Temporada aberta no momento.
        </p>
      )}

      {temporada && niveis.length === 0 && (
        <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
          A Estrutura de Blinds desta Temporada ainda não foi definida.
        </p>
      )}

      {niveis.length > 0 && (
        <section className="felt-glow relative overflow-hidden rounded-xl border border-primary-fixed-dim/20 bg-primary-container p-5">
          <span
            className="material-symbols-outlined pointer-events-none absolute -bottom-4 -right-4 select-none text-[120px] text-black/10"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            timer
          </span>

          <div className="relative z-10 grid grid-cols-[2rem_1.4fr_1fr_1fr] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-white/70">
            <span>Nv.</span>
            <span className="text-center">SB / BB</span>
            <span className="text-center">Duração</span>
            <span className="text-center">Acumulado</span>
          </div>

          <div className="relative z-10 flex flex-col gap-2">
            {niveis.reduce<{ acumulado: number; linhas: React.ReactNode[] }>(
              (estado, nivel, indice) => {
                const acumuladoAteAqui = estado.acumulado;
                estado.linhas.push(
                  <div
                    key={indice}
                    className="grid grid-cols-[2rem_1.4fr_1fr_1fr] items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-white"
                  >
                    <span className="text-center font-bold">{indice + 1}</span>
                    <span className="whitespace-nowrap text-center font-mono text-[13px] sm:text-base">
                      {formatarNumero(nivel.blindPequeno)}/{formatarNumero(nivel.blindGrande)}
                    </span>
                    <span className="text-center font-mono text-white/80">
                      {nivel.duracaoMinutos}min
                    </span>
                    <span className="text-center font-mono text-secondary">
                      {formatarDuracaoAcumulada(acumuladoAteAqui)}
                    </span>
                  </div>,
                );
                estado.acumulado += nivel.duracaoMinutos;
                return estado;
              },
              { acumulado: 0, linhas: [] },
            ).linhas}
          </div>
        </section>
      )}

      <p className="text-center text-label-sm text-on-surface-variant">
        <Link href="/partidas" className="text-primary hover:underline">
          Ver Partidas
        </Link>{" "}
        — o Timer ao vivo de cada uma fica na página da própria Partida.
      </p>
    </main>
  );
}
