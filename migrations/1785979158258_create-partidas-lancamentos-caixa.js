/**
 * Partida, seus Lançamentos por Jogador (ver CONTEXT.md) e a entrada
 * automática que ela gera no Caixa.
 *
 * `posicao` em lancamentos é opcional: a linha existe desde a criação da
 * Partida (um Jogador foi convocado pra ela), mas só ganha
 * posicao/almas/pagamento quando o Organizador lança o resultado —
 * `posicao IS NULL` é o estado "ainda não lançado".
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("partidas", {
    id: "id",
    temporada_id: {
      type: "integer",
      notNull: true,
      references: "temporadas",
      onDelete: "restrict",
    },
    data: { type: "date", notNull: true },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("lancamentos", {
    id: "id",
    partida_id: {
      type: "integer",
      notNull: true,
      references: "partidas",
      onDelete: "cascade",
    },
    jogador_id: {
      type: "integer",
      notNull: true,
      references: "jogadores",
      onDelete: "restrict",
    },
    posicao: { type: "integer" },
    almas: { type: "integer", notNull: true, default: 0 },
    pagamento: { type: "boolean", notNull: true, default: false },
  });
  pgm.addConstraint("lancamentos", "lancamento_unico_por_jogador_na_partida", {
    unique: ["partida_id", "jogador_id"],
  });

  pgm.createTable("caixa_transacoes", {
    id: "id",
    temporada_id: {
      type: "integer",
      notNull: true,
      references: "temporadas",
      onDelete: "restrict",
    },
    tipo: {
      type: "text",
      notNull: true,
      check: "tipo IN ('entrada_partida', 'saida_manual')",
    },
    valor: { type: "numeric", notNull: true },
    data: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    partida_id: {
      type: "integer",
      references: "partidas",
      onDelete: "cascade",
    },
    descricao: { type: "text" },
  });
  // No máximo uma entrada automática por Partida — lançar resultado de
  // novo faz UPDATE nela em vez de duplicar (ver ON CONFLICT em
  // src/lib/partidas.ts).
  pgm.createIndex("caixa_transacoes", "partida_id", {
    unique: true,
    where: "tipo = 'entrada_partida'",
    name: "caixa_transacao_entrada_unica_por_partida",
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("caixa_transacoes");
  pgm.dropTable("lancamentos");
  pgm.dropTable("partidas");
};
