/**
 * Suporta o novo fluxo de Partida "em andamento": ela pode ser criada,
 * editada (data, participantes) e ter Lançamentos preenchidos aos poucos
 * (conforme os participantes vão saindo) antes de ser Finalizada.
 *
 * `finalizada` substitui a antiga premissa de que "todo Lançamento tem
 * posicao" já significava resultado fechado — agora isso pode ficar
 * parcialmente preenchido por um tempo, então precisa de um estado
 * explícito.
 *
 * `eliminado_por_jogador_id` troca o antigo campo `almas` (um número
 * solto digitado pelo Organizador) por um registro de fato de quem
 * eliminou quem — Almas passa a ser derivado (ver src/lib/partidas.ts).
 * Partidas já finalizadas sob o modelo antigo têm seus Lançamentos
 * marcados como finalizados aqui, mas o valor de `almas` que elas tinham
 * não é reconstruível automaticamente (não dá pra saber quem eliminou
 * quem só a partir de um número) — precisa ser relançado manualmente
 * pelo Organizador com os dados reais.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.addColumn("partidas", {
    finalizada: { type: "boolean", notNull: true, default: false },
  });

  // Partidas que já tinham todo mundo com posicao preenchida (sob o
  // modelo antigo, atômico) contam como já finalizadas.
  pgm.sql(`
    UPDATE partidas
    SET finalizada = true
    WHERE id IN (
      SELECT partida_id
      FROM lancamentos
      GROUP BY partida_id
      HAVING bool_and(posicao IS NOT NULL)
    )
  `);

  pgm.addColumn("lancamentos", {
    eliminado_por_jogador_id: {
      type: "integer",
      references: "jogadores",
      onDelete: "restrict",
    },
  });
  pgm.addConstraint("lancamentos", "eliminador_diferente_do_jogador", {
    check:
      "eliminado_por_jogador_id IS NULL OR eliminado_por_jogador_id != jogador_id",
  });

  pgm.dropColumn("lancamentos", "almas");
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.addColumn("lancamentos", {
    almas: { type: "integer", notNull: true, default: 0 },
  });
  pgm.dropColumn("lancamentos", "eliminado_por_jogador_id");
  pgm.dropColumn("partidas", "finalizada");
};
