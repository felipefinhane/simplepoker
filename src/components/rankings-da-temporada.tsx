import Link from "next/link";
import type { EntradaDeRanking } from "@/lib/rankings";

interface PartidaResumo {
  id: number;
  data: string;
  participantes: number;
}

/** Primeira letra do primeiro nome, maiúscula — usada como avatar. */
function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase();
}

function formatarData(data: string): string {
  const [, mes, dia] = data.split("-");
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
  return `${dia} ${meses[Number(mes) - 1]}`;
}

function Podio({ entradas }: { entradas: EntradaDeRanking[] }) {
  const [primeiro, segundo, terceiro] = entradas;

  return (
    <div className="mb-section-margin grid grid-cols-3 items-end gap-3">
      {segundo && (
        <div className="glass-card relative order-2 mt-8 flex h-[140px] flex-col items-center justify-end rounded-xl p-4 text-center md:order-1">
          <div className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container-highest text-headline-md font-bold text-on-surface">
            {inicial(segundo.nome)}
          </div>
          <div className="mt-2 w-full truncate text-body-md font-semibold text-on-surface">
            {segundo.nome}
          </div>
          <div className="mt-1 text-label-data text-on-surface-variant">
            {segundo.totalPontos} pts
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-error">
            <span className="material-symbols-outlined text-[14px]">skull</span>
            {segundo.totalAlmas}
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-tertiary-container" />
        </div>
      )}

      {primeiro && (
        <div className="felt-glow relative order-1 flex h-[170px] flex-col items-center justify-end rounded-xl border border-secondary/50 bg-gradient-to-br from-surface-container-high to-surface-container p-4 text-center shadow-[0_0_15px_rgba(233,195,73,0.15)] md:order-2">
          <div className="absolute -top-10 flex flex-col items-center">
            <span
              className="material-symbols-outlined mb-[-4px] text-[28px] text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              crown
            </span>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-secondary bg-secondary/10 text-headline-md font-bold text-secondary backdrop-blur-sm">
              {inicial(primeiro.nome)}
            </div>
          </div>
          <div className="mt-2 w-full truncate text-headline-md font-bold text-secondary">
            {primeiro.nome}
          </div>
          <div className="mt-1 text-[24px] leading-tight text-on-surface">
            {primeiro.totalPontos}{" "}
            <span className="text-sm font-normal text-on-surface-variant">pts</span>
          </div>
          <div className="mt-2 flex items-center gap-1 rounded bg-error/10 px-2 py-0.5 text-sm text-error">
            <span className="material-symbols-outlined text-[16px]">skull</span>
            {primeiro.totalAlmas}
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-secondary" />
        </div>
      )}

      {terceiro && (
        <div className="glass-card relative order-3 mt-10 flex h-[130px] flex-col items-center justify-end rounded-xl p-4 text-center">
          <div className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container-highest text-headline-md font-bold text-tertiary">
            {inicial(terceiro.nome)}
          </div>
          <div className="mt-2 w-full truncate text-body-md font-semibold text-on-surface">
            {terceiro.nome}
          </div>
          <div className="mt-1 text-label-data text-on-surface-variant">
            {terceiro.totalPontos} pts
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-error">
            <span className="material-symbols-outlined text-[14px]">skull</span>
            {terceiro.totalAlmas}
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-tertiary-container" />
        </div>
      )}
    </div>
  );
}

function ClassificacaoGeral({ entradas }: { entradas: EntradaDeRanking[] }) {
  if (entradas.length === 0) return null;

  return (
    <div className="mb-section-margin">
      <h3 className="mb-4 flex items-center gap-2 text-body-lg text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
        Classificação Geral
      </h3>
      <div className="flex flex-col gap-2">
        {entradas.map((entrada, indice) => (
          <div
            key={entrada.jogadorId}
            className="flex items-center rounded-lg border border-surface-container-high bg-surface-container-low p-3 transition-colors hover:bg-surface-container"
          >
            <div className="mr-2 w-8 text-center text-label-data text-on-surface-variant">
              {indice + 4}º
            </div>
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-body-md font-bold text-on-surface">
              {inicial(entrada.nome)}
            </div>
            <div className="flex-1 truncate text-body-md font-semibold text-on-surface">
              {entrada.nome}
            </div>
            <div className="flex flex-col items-end">
              <div className="text-label-data font-bold text-on-surface">
                {entrada.totalPontos} pts
              </div>
              <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-error opacity-80">
                <span className="material-symbols-outlined text-[12px]">skull</span>
                {entrada.totalAlmas}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingCarrasco({ entradas }: { entradas: EntradaDeRanking[] }) {
  const [primeiro, ...resto] = entradas;

  return (
    <div className="glass-card relative overflow-hidden rounded-xl p-5">
      <div className="pointer-events-none absolute -right-4 -top-4 opacity-5">
        <span className="material-symbols-outlined text-[120px]">skull</span>
      </div>
      <h3 className="mb-4 flex items-center gap-2 text-headline-md text-error">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          skull
        </span>
        Ranking Carrasco
      </h3>

      {!primeiro ? (
        <p className="text-body-md text-on-surface-variant">
          Nenhuma eliminação registrada ainda.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center rounded-lg border border-error/20 bg-surface-container/50 p-3">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-body-md font-bold text-error">
              {inicial(primeiro.nome)}
            </div>
            <div className="flex-1">
              <div className="text-body-md font-semibold text-on-surface">{primeiro.nome}</div>
              <div className="text-xs text-on-surface-variant">Maior eliminador</div>
            </div>
            <div className="text-[24px] text-error">
              {primeiro.totalAlmas} <span className="text-xs font-normal">Almas</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {resto.map((entrada, indice) => (
              <div
                key={entrada.jogadorId}
                className="flex items-center justify-between border-b border-surface-container-high py-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 text-sm text-on-surface-variant">{indice + 2}</span>
                  <span className="text-body-md text-on-surface">{entrada.nome}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-error/80">
                  <span className="material-symbols-outlined text-[16px]">skull</span>
                  {entrada.totalAlmas}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UltimasPartidas({ partidas }: { partidas: PartidaResumo[] }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="mb-4 flex items-center gap-2 text-headline-md text-on-surface">
        <span className="material-symbols-outlined">history</span>
        Últimas Partidas
      </h3>

      {partidas.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">
          Nenhuma Partida finalizada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {partidas.slice(0, 5).map((partida) => (
            <Link
              key={partida.id}
              href={`/partidas/${partida.id}`}
              className="group flex cursor-pointer items-center justify-between rounded-lg border border-surface-container-high bg-surface-container-low p-3 transition-colors hover:border-outline-variant"
            >
              <div>
                <div className="text-label-data font-semibold text-on-surface transition-colors group-hover:text-primary">
                  Partida — {formatarData(partida.data)}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">groups</span>
                    {partida.participantes} Jogadores
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant transition-colors group-hover:text-primary">
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function RankingsDaTemporada({
  rankingDePontuacao,
  rankingCarrasco,
  partidas,
}: {
  rankingDePontuacao: EntradaDeRanking[];
  rankingCarrasco: EntradaDeRanking[];
  partidas: PartidaResumo[];
}) {
  if (rankingDePontuacao.length === 0) {
    return (
      <p className="text-body-md text-on-surface-variant">
        Nenhuma Partida lançada ainda nesta Temporada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Podio entradas={rankingDePontuacao.slice(0, 3)} />
        <ClassificacaoGeral entradas={rankingDePontuacao.slice(3)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RankingCarrasco entradas={rankingCarrasco} />
        <UltimasPartidas partidas={partidas} />
      </div>
    </div>
  );
}
