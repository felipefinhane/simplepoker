/**
 * Inscrições de notificação push por Partida — qualquer visitante (não só
 * o Organizador) pode ativar "avisar quando o blind mudar" enquanto olha
 * o Timer de uma Partida específica; cada dispositivo/navegador gera um
 * `endpoint` próprio ao se inscrever (Web Push API). Ver src/lib/push.ts.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("push_subscriptions", {
    id: "id",
    partida_id: {
      type: "integer",
      notNull: true,
      references: "partidas",
      onDelete: "cascade",
    },
    endpoint: { type: "text", notNull: true },
    p256dh: { type: "text", notNull: true },
    auth: { type: "text", notNull: true },
    criado_em: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  // Reinscrever no mesmo endpoint (ex: reabriu o app) atualiza em vez de
  // duplicar — ver `salvarInscricao` (ON CONFLICT).
  pgm.addConstraint("push_subscriptions", "push_subscriptions_partida_endpoint_key", {
    unique: ["partida_id", "endpoint"],
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("push_subscriptions");
};
