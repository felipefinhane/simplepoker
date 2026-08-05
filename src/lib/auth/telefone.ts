/**
 * Normaliza um telefone pra só dígitos, pra que "11 99999-8888" e
 * "11999998888" sejam tratados como o mesmo telefone tanto ao guardar
 * quanto ao conferir no login.
 */
export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}
