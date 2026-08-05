/**
 * Jogador (ver CONTEXT.md). Organizador é um Jogador com eh_organizador
 * true — nesse caso telefone e senha_hash são obrigatórios (é como ele
 * loga); os demais Jogadores não têm conta, então ficam nulos.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("jogadores", {
    id: "id",
    nome: { type: "text", notNull: true },
    telefone: { type: "text", unique: true },
    senha_hash: { type: "text" },
    eh_organizador: { type: "boolean", notNull: true, default: false },
    criado_em: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(
    "jogadores",
    "organizador_tem_telefone_e_senha",
    "CHECK (NOT eh_organizador OR (telefone IS NOT NULL AND senha_hash IS NOT NULL))",
  );
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("jogadores");
};
