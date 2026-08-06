/**
 * Estado do Timer de blinds de uma Partida (1:1 — cada Partida tem no
 * máximo um). `inicio_do_nivel` é o instante em que a contagem do nível
 * atual começou a rodar (null quando pausado/parado); `segundos_decorridos`
 * acumula o tempo já passado dentro do nível atual, congelado sempre que
 * pausa — ver src/lib/timer.ts.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("timers_de_partida", {
    partida_id: {
      type: "integer",
      primaryKey: true,
      references: "partidas",
      onDelete: "cascade",
    },
    nivel: { type: "integer", notNull: true, default: 0 },
    rodando: { type: "boolean", notNull: true, default: false },
    inicio_do_nivel: { type: "timestamptz" },
    segundos_decorridos: { type: "integer", notNull: true, default: 0 },
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("timers_de_partida");
};
