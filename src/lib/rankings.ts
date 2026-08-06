import { db } from "@/lib/db";
import {
  agregarResultadosPorJogador,
  calcularRankingCarrasco,
  calcularRankingDePontuacao,
} from "@/domain/ranking";
import type { LancamentoDoJogador } from "@/domain/types";
import { buscarTemporadaPorId } from "@/lib/temporadas";

/** Uma linha de um dos rankings, já com o nome do Jogador resolvido. */
export interface EntradaDeRanking {
  jogadorId: number;
  nome: string;
  totalPontos: number;
  totalAlmas: number;
}

export interface RankingsDaTemporada {
  rankingDePontuacao: EntradaDeRanking[];
  rankingCarrasco: EntradaDeRanking[];
}

/**
 * Ranking de Pontuação e Ranking Carrasco de uma Temporada, a partir dos
 * Lançamentos de todas as suas Partidas já lançadas (`posicao IS NOT
 * NULL` — Partidas pendentes não contam, e como lançar é atômico, uma
 * Partida nunca fica "meio lançada").
 *
 * O núcleo de cálculo (ticket 02, `AgregadoDoJogador.jogadorId`) agrega
 * por uma string qualquer — aqui usamos o **id numérico do Jogador**
 * (como string), não o nome: o nome não tem unicidade garantida no banco
 * (só `telefone` é único), e agregar por nome misturaria silenciosamente
 * as estatísticas de dois Jogadores com o mesmo nome. O nome só entra no
 * final, pra exibição, resolvido a partir do id.
 *
 * Efeito colateral aceito: o desempate alfabético final (ver CONTEXT.md)
 * passa a ordenar pelo id numérico, não pelo nome — só importa no caso
 * raro de empate total em Pontos e Almas entre dois Jogadores, e correção
 * de dados (nunca misturar duas pessoas) pesa mais que a ordem exata
 * nesse desempate.
 */
export async function calcularRankingsDaTemporada(
  temporadaId: number,
): Promise<RankingsDaTemporada | null> {
  const temporada = await buscarTemporadaPorId(temporadaId);
  if (!temporada) return null;

  const { rows } = await db.query<{
    jogador_id: number;
    nome: string;
    posicao: number;
    almas: number;
  }>(
    `SELECT l.jogador_id, j.nome, l.posicao, l.almas
     FROM lancamentos l
     JOIN partidas p ON p.id = l.partida_id
     JOIN jogadores j ON j.id = l.jogador_id
     WHERE p.temporada_id = $1 AND l.posicao IS NOT NULL`,
    [temporadaId],
  );

  const nomesPorId = new Map(
    rows.map((linha) => [String(linha.jogador_id), linha.nome]),
  );

  const lancamentos: LancamentoDoJogador[] = rows.map((linha) => ({
    jogadorId: String(linha.jogador_id),
    posicao: linha.posicao,
    almas: linha.almas,
  }));

  const agregados = agregarResultadosPorJogador(
    lancamentos,
    temporada.parametros.tabelaDePontos,
  );

  const comNome = (ag: {
    jogadorId: string;
    totalPontos: number;
    totalAlmas: number;
  }): EntradaDeRanking => ({
    jogadorId: Number(ag.jogadorId),
    nome: nomesPorId.get(ag.jogadorId) ?? "?",
    totalPontos: ag.totalPontos,
    totalAlmas: ag.totalAlmas,
  });

  return {
    rankingDePontuacao: calcularRankingDePontuacao(agregados).map(comNome),
    rankingCarrasco: calcularRankingCarrasco(agregados).map(comNome),
  };
}
