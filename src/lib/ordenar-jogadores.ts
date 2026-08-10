/**
 * Ordena Jogadores: ativos primeiro, depois inativos — dentro de cada
 * grupo, alfabético. Usado em toda listagem de Jogadores (CRUD, modal de
 * gerenciar, seleção de participantes — ver ticket 45). Sem dependência
 * de banco (`@/lib/jogadores` puxa `pg`, server-only) — importável tanto
 * em Server quanto em Client Components.
 */
export function compararJogadoresPorAtivoENome(
  a: { ativo: boolean; nome: string },
  b: { ativo: boolean; nome: string },
): number {
  if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
  return a.nome.localeCompare(b.nome, "pt-BR");
}
