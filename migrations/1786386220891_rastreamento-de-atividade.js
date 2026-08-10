/**
 * Rastreamento de atividade (ticket 44) — com múltiplos Organizadores
 * (ticket 43), passou a importar saber quem criou/editou um registro, e
 * ter um histórico completo das ações mais sensíveis.
 *
 * Duas peças:
 * 1. Colunas `criado_por_jogador_id`/`atualizado_por_jogador_id`/
 *    `atualizado_em` nas tabelas principais — responde "quem criou" e
 *    "quem editou por último" sem precisar de nenhuma consulta extra.
 *    `ON DELETE SET NULL`: apagar um Jogador (não deveria acontecer via
 *    app hoje, mas por segurança) não pode travar nem apagar o registro
 *    que ele criou/editou — só perde a atribuição.
 * 2. Tabela `eventos_de_auditoria` — histórico completo (não só o último
 *    toque) das ações mais sensíveis, com snapshot antes/depois. Ver
 *    src/lib/auditoria.ts.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const COLUNAS_DE_AUTORIA = {
  criado_por_jogador_id: {
    type: "integer",
    references: "jogadores",
    onDelete: "SET NULL",
  },
  atualizado_por_jogador_id: {
    type: "integer",
    references: "jogadores",
    onDelete: "SET NULL",
  },
  atualizado_em: { type: "timestamptz" },
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.addColumns("jogadores", COLUNAS_DE_AUTORIA);
  pgm.addColumns("temporadas", COLUNAS_DE_AUTORIA);
  pgm.addColumns("partidas", COLUNAS_DE_AUTORIA);
  pgm.addColumns("lancamentos", { criado_em: { type: "timestamptz", notNull: true, default: pgm.func("now()") }, ...COLUNAS_DE_AUTORIA });
  pgm.addColumns("caixa_transacoes", COLUNAS_DE_AUTORIA);

  pgm.createTable("eventos_de_auditoria", {
    id: "id",
    // Nullable de propósito: null = ação de script/sistema (import
    // histórico, seed), não de um Organizador logado.
    jogador_id: { type: "integer", references: "jogadores", onDelete: "SET NULL" },
    acao: { type: "text", notNull: true },
    entidade_tipo: { type: "text", notNull: true },
    entidade_id: { type: "integer", notNull: true },
    dados_antes: { type: "jsonb" },
    dados_depois: { type: "jsonb" },
    criado_em: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("eventos_de_auditoria", ["entidade_tipo", "entidade_id"]);
  pgm.createIndex("eventos_de_auditoria", ["criado_em"]);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("eventos_de_auditoria");
  pgm.dropColumns("caixa_transacoes", Object.keys(COLUNAS_DE_AUTORIA));
  pgm.dropColumns("lancamentos", ["criado_em", ...Object.keys(COLUNAS_DE_AUTORIA)]);
  pgm.dropColumns("partidas", Object.keys(COLUNAS_DE_AUTORIA));
  pgm.dropColumns("temporadas", Object.keys(COLUNAS_DE_AUTORIA));
  pgm.dropColumns("jogadores", Object.keys(COLUNAS_DE_AUTORIA));
};
