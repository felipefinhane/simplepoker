import { calcularPontosDoLancamento } from "./pontos";
import type { TabelaDePontos } from "./tabela-de-pontos";
import type { LancamentoDoJogador } from "./types";

/** Totais de um Jogador na Temporada, base dos dois rankings. */
export interface AgregadoDoJogador {
  jogadorId: string;
  totalPontos: number;
  totalAlmas: number;
}

/** Soma Pontos e Almas de todos os lançamentos de cada Jogador na Temporada. */
export function agregarResultadosPorJogador(
  lancamentos: LancamentoDoJogador[],
  tabela: TabelaDePontos,
): AgregadoDoJogador[] {
  const porJogador = new Map<string, AgregadoDoJogador>();

  for (const lancamento of lancamentos) {
    const atual = porJogador.get(lancamento.jogadorId) ?? {
      jogadorId: lancamento.jogadorId,
      totalPontos: 0,
      totalAlmas: 0,
    };

    porJogador.set(lancamento.jogadorId, {
      jogadorId: lancamento.jogadorId,
      totalPontos:
        atual.totalPontos + calcularPontosDoLancamento(lancamento, tabela),
      totalAlmas: atual.totalAlmas + lancamento.almas,
    });
  }

  return [...porJogador.values()];
}

/**
 * Critério de desempate compartilhado pelos dois rankings: quando o
 * critério principal empata, cai para o secundário; se ainda empatar,
 * ordem alfabética do jogador garante um resultado determinístico.
 *
 * Não foi confirmado com o Organizador (a planilha real não tem empates) —
 * assumido como razoável até ser validado ou substituído.
 */
function compararComDesempate(
  a: AgregadoDoJogador,
  b: AgregadoDoJogador,
  principal: keyof Pick<AgregadoDoJogador, "totalPontos" | "totalAlmas">,
  secundario: keyof Pick<AgregadoDoJogador, "totalPontos" | "totalAlmas">,
): number {
  if (b[principal] !== a[principal]) {
    return b[principal] - a[principal];
  }
  if (b[secundario] !== a[secundario]) {
    return b[secundario] - a[secundario];
  }
  return a.jogadorId.localeCompare(b.jogadorId);
}

/** Ranking de Pontuação: Jogadores ordenados pela soma de Pontos na Temporada. */
export function calcularRankingDePontuacao(
  agregados: AgregadoDoJogador[],
): AgregadoDoJogador[] {
  return [...agregados].sort((a, b) =>
    compararComDesempate(a, b, "totalPontos", "totalAlmas"),
  );
}

/** Ranking Carrasco: Jogadores ordenados pela soma de Almas na Temporada. */
export function calcularRankingCarrasco(
  agregados: AgregadoDoJogador[],
): AgregadoDoJogador[] {
  return [...agregados].sort((a, b) =>
    compararComDesempate(a, b, "totalAlmas", "totalPontos"),
  );
}
