/**
 * `push_subscriptions.partida_id` passa a aceitar `NULL` — inscrição
 * **global**, recebe "partida começou"/"partida terminou"/"jogador saiu"
 * de qualquer Partida (ticket 48), em vez de só a troca de blind de uma
 * Partida específica (o que já existia, ticket 39). Reaproveita a mesma
 * tabela em vez de criar uma paralela — a diferença é só o valor da
 * coluna. Ver src/lib/push.ts.
 *
 * A constraint única existente (`partida_id`, `endpoint`) continua valendo
 * pra inscrições contextuais, mas não pega duplicata quando `partida_id`
 * é `NULL` (SQL padrão trata cada `NULL` como distinto dos demais) — daí o
 * índice único parcial abaixo, só sobre `endpoint`, restrito às linhas
 * globais.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.alterColumn("push_subscriptions", "partida_id", { notNull: false });

  pgm.createIndex("push_subscriptions", "endpoint", {
    unique: true,
    where: "partida_id IS NULL",
    name: "push_subscriptions_endpoint_global_unica",
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropIndex("push_subscriptions", "endpoint", {
    name: "push_subscriptions_endpoint_global_unica",
  });
  pgm.alterColumn("push_subscriptions", "partida_id", { notNull: true });
};
