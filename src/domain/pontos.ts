import type { TabelaDePontos } from "./tabela-de-pontos";
import { pontosDaPosicao } from "./tabela-de-pontos";
import type { LancamentoDeResultado } from "./types";

/**
 * Pontos de um Jogador numa Partida = pontos da Posição (via Tabela de
 * Pontos) + 1 por Alma. Ver CONTEXT.md.
 */
export function calcularPontosDoLancamento(
  lancamento: LancamentoDeResultado,
  tabela: TabelaDePontos,
): number {
  return pontosDaPosicao(tabela, lancamento.posicao) + lancamento.almas;
}
