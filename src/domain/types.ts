/** Um Lançamento: Posição e Almas de um Jogador numa Partida. Ver CONTEXT.md. */
export interface LancamentoDeResultado {
  posicao: number;
  almas: number;
}

/** Um Lançamento identificado por Jogador, para agregação na Temporada. */
export interface LancamentoDoJogador extends LancamentoDeResultado {
  jogadorId: string;
}

import type { TabelaDePontos } from "./tabela-de-pontos";

/** Um nível da Estrutura de Blinds. Ver CONTEXT.md. */
export interface NivelDeBlind {
  blindPequeno: number;
  blindGrande: number;
  duracaoMinutos: number;
}

/** Uma ficha (valor + quantidade) na composição das Fichas Iniciais. */
export interface FichaInicial {
  valor: number;
  quantidade: number;
}

/** Parâmetros da Temporada, completos (ver CONTEXT.md). */
export interface ParametrosDaTemporada {
  tabelaDePontos: TabelaDePontos;
  valorDaPartida: number;
  multiplicadorPremiacaoPrimeiro: number;
  multiplicadorPremiacaoSegundo: number;
  estruturaDeBlinds: NivelDeBlind[];
  fichasIniciais: FichaInicial[];
}

/**
 * Só os campos dos Parâmetros da Temporada usados pelo cálculo de
 * Premiação da Partida e da entrada no Caixa — Tabela de Pontos, Estrutura
 * de Blinds e Fichas Iniciais não entram nessas contas.
 */
export type ParametrosDePremiacao = Pick<
  ParametrosDaTemporada,
  "valorDaPartida" | "multiplicadorPremiacaoPrimeiro" | "multiplicadorPremiacaoSegundo"
>;
