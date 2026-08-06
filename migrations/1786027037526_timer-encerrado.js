/**
 * `encerrado`: trava permanente do Timer de uma Partida — ver
 * `encerrarTimer` em src/lib/timer.ts. Diferente de pausar (que é
 * reversível), encerrar zera o estado e bloqueia qualquer novo controle
 * (iniciar/pausar/pular ou voltar nível/reiniciar) daquele Timer.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.addColumn("timers_de_partida", {
    encerrado: { type: "boolean", notNull: true, default: false },
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropColumn("timers_de_partida", "encerrado");
};
