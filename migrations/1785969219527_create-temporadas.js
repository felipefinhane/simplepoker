/**
 * Temporada, com os Parâmetros da Temporada embutidos (ver CONTEXT.md).
 * `tabela_de_pontos`, `estrutura_de_blinds` e `fichas_iniciais` guardam
 * estruturas de tamanho variável, então ficam em jsonb em vez de colunas
 * fixas.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("temporadas", {
    id: "id",
    aberta: { type: "boolean", notNull: true, default: true },
    data_inicio: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    data_fim: { type: "timestamptz" },
    tabela_de_pontos: { type: "jsonb", notNull: true },
    valor_da_partida: { type: "numeric", notNull: true },
    multiplicador_premiacao_primeiro: { type: "numeric", notNull: true },
    multiplicador_premiacao_segundo: { type: "numeric", notNull: true },
    estrutura_de_blinds: { type: "jsonb", notNull: true },
    fichas_iniciais: { type: "jsonb", notNull: true },
  });

  // No máximo uma Temporada aberta por vez (CONTEXT.md).
  pgm.createIndex("temporadas", "aberta", {
    unique: true,
    where: "aberta = true",
    name: "temporada_aberta_unica",
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("temporadas");
};
