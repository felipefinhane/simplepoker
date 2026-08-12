import { db } from "@/lib/db";
import { calcularAlmas } from "@/domain/alma";
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
 * Lançamentos de todas as suas Partidas **finalizadas** (uma Partida em
 * andamento pode ter posições parciais — só conta pro ranking depois de
 * finalizada).
 *
 * Almas é derivado por Lançamento via `calcularAlmas` (ver CONTEXT.md) a
 * partir de quantos Jogadores cada um eliminou nessa Partida (conta de
 * `eliminado_por_jogador_id` apontando pra ele).
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
    quantidade_eliminados: number;
  }>(
    `SELECT
       l.jogador_id,
       j.nome,
       l.posicao,
       COALESCE(elims.qtd, 0)::integer AS quantidade_eliminados
     FROM lancamentos l
     JOIN partidas p ON p.id = l.partida_id
     JOIN jogadores j ON j.id = l.jogador_id
     LEFT JOIN (
       SELECT partida_id, eliminado_por_jogador_id, COUNT(*)::integer AS qtd
       FROM lancamentos
       WHERE eliminado_por_jogador_id IS NOT NULL
       GROUP BY partida_id, eliminado_por_jogador_id
     ) elims
       ON elims.partida_id = l.partida_id
       AND elims.eliminado_por_jogador_id = l.jogador_id
     WHERE p.temporada_id = $1 AND p.finalizada = true`,
    [temporadaId],
  );

  const nomesPorId = new Map(
    rows.map((linha) => [String(linha.jogador_id), linha.nome]),
  );

  const lancamentos: LancamentoDoJogador[] = rows.map((linha) => ({
    jogadorId: String(linha.jogador_id),
    posicao: linha.posicao,
    almas: calcularAlmas(linha.quantidade_eliminados, linha.posicao),
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

/** Projeção de quanto um Jogador teria no Ranking de Pontuação, ver `calcularProjecaoDeRanking`. */
export interface ProjecaoDeRanking {
  totalAtualNaTemporada: number;
  pontosDestaPartida: number;
  totalProjetado: number;
}

/** Projeção por Jogador, ver `calcularProjecaoDeRanking` — só entram os que já têm Posição definida (já saíram). */
export type ProjecoesPorJogador = Record<number, ProjecaoDeRanking>;

/**
 * Quanto o Jogador teria de Pontos no Ranking de Pontuação da Temporada se
 * a Partida em andamento fosse contabilizada agora — soma o total já
 * oficial (só Partidas finalizadas, ver `calcularRankingsDaTemporada`) com
 * os Pontos que ele já garantiu nesta Partida (`pontosDestaPartida`, que
 * quem chama pega de `LancamentoDaPartida.pontos` — só existe depois que
 * ele já tem Posição definida, ou seja, já saiu). Ticket 50.
 *
 * É uma **projeção**, não o Ranking de verdade: os demais participantes
 * ainda ativos nesta Partida podem terminar com mais Pontos e mudar a
 * posição dele no ranking depois que a Partida for finalizada — por isso
 * só devolve o total, não uma posição no ranking (mostrar uma posição
 * ainda não definitiva enganaria mais do que ajudaria).
 */
export async function calcularProjecaoDeRanking(
  temporadaId: number,
  jogadorId: number,
  pontosDestaPartida: number,
): Promise<ProjecaoDeRanking | null> {
  const rankings = await calcularRankingsDaTemporada(temporadaId);
  if (!rankings) return null;

  const totalAtualNaTemporada =
    rankings.rankingDePontuacao.find((entrada) => entrada.jogadorId === jogadorId)?.totalPontos ?? 0;

  return {
    totalAtualNaTemporada,
    pontosDestaPartida,
    totalProjetado: totalAtualNaTemporada + pontosDestaPartida,
  };
}
