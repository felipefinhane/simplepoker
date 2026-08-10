/**
 * Normaliza um telefone pra só dígitos, pra que "11 99999-8888" e
 * "11999998888" sejam tratados como o mesmo telefone tanto ao guardar
 * quanto ao conferir no login.
 */
export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

/**
 * Formata como "(99) 99999-9999" enquanto digita — só cosmético (padrão
 * brasileiro de celular, DDD + 9 dígitos), o back-end sempre normaliza
 * pra dígitos puros de qualquer forma (`normalizarTelefone`), então o
 * valor mascarado pode ser enviado direto sem conversão antes. Usado em
 * todo campo de telefone do app (login, promover Jogador a Organizador).
 */
export function formatarTelefone(valor: string): string {
  const digitos = normalizarTelefone(valor).slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}
