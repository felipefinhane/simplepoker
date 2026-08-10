/**
 * Spinner reaproveitado em botões durante uma ação assíncrona (salvar,
 * enviar, pular nível, etc.) — sem esse feedback visual, um toque que já
 * foi registrado mas ainda está em andamento parece que "não fez nada".
 * Ícone "progress_activity" (Material Symbols, mesma fonte já usada no
 * resto do app) girando via `animate-spin` (utility padrão do Tailwind).
 */
export function IconeCarregando({
  tamanho = 20,
  className = "",
}: {
  /** Em pixels — via `style`, não uma classe de tamanho, pra nunca disputar com outra. */
  tamanho?: number;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined animate-spin ${className}`}
      style={{ fontSize: tamanho }}
      aria-hidden="true"
    >
      progress_activity
    </span>
  );
}
