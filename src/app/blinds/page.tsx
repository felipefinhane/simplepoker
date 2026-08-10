import Link from "next/link";
import { buscarTemporadaAberta } from "@/lib/temporadas";
import { listarPartidasDaTemporada, partidaEstaEditavelPeloOrganizador } from "@/lib/partidas";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { TimerClient } from "@/app/partidas/[id]/timer-client";

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
 * (a tabela de referência configurada nos Parâmetros da Temporada, ticket
 * 05) mais o Timer ao vivo da Partida em andamento, se houver (ticket 40)
 * — pensado pra quem não conhece bem o app: em vez de precisar achar a
 * Partida certa em "Partidas", quem só quer acompanhar o blind atual acha
 * aqui direto, na mesma página que já ia olhar de qualquer forma.
 */
export default async function BlindsPage() {
  const [temporada, organizador] = await Promise.all([
    buscarTemporadaAberta(),
    getOrganizadorLogado(),
  ]);
  const niveis = temporada?.parametros.estruturaDeBlinds ?? [];
  const partidas = temporada ? await listarPartidasDaTemporada(temporada.id) : [];
  const partidaEmAndamento = partidas.find((p) => !p.finalizada) ?? null;
  const podeControlarTimer = partidaEmAndamento
    ? partidaEstaEditavelPeloOrganizador(partidaEmAndamento, Boolean(temporada?.aberta), Boolean(organizador))
    : false;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Estrutura de Blinds</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Níveis de blind e duração configurados para a Temporada atual.
        </p>
      </div>

      {partidaEmAndamento && (
        <TimerClient partidaId={partidaEmAndamento.id} podeControlar={podeControlarTimer} />
      )}

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
        {partidaEmAndamento
          ? "— resultados e detalhes de cada uma ficam por lá."
          : "— o Timer ao vivo de uma Partida em andamento aparece aqui e também na página dela."}
      </p>
    </main>
  );
}
