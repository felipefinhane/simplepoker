"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconeCarregando } from "@/components/icone-carregando";

const CAMPO_CLASSE =
  "w-full rounded-lg border border-surface-variant bg-surface-container-highest px-3 py-2 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const RUBRICA_CLASSE = "mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant";

export function SaidaManualForm({ temporadaId }: { temporadaId: number }) {
  const router = useRouter();
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch(`/api/temporadas/${temporadaId}/caixa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, descricao, valor: Number(valor) }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível lançar a saída.");
        return;
      }

      setDescricao("");
      setValor("");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-stack-gap">
      <div className="grid grid-cols-1 gap-stack-gap sm:grid-cols-2">
        <div>
          <label htmlFor="saida-data" className={RUBRICA_CLASSE}>
            Data
          </label>
          <input
            id="saida-data"
            type="date"
            required
            value={data}
            onChange={(event) => setData(event.target.value)}
            className={CAMPO_CLASSE}
          />
        </div>
        <div>
          <label htmlFor="saida-valor" className={RUBRICA_CLASSE}>
            Valor (R$)
          </label>
          <input
            id="saida-valor"
            type="number"
            min={0.01}
            step="0.01"
            required
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            className={CAMPO_CLASSE}
          />
        </div>
      </div>

      <div>
        <label htmlFor="saida-descricao" className={RUBRICA_CLASSE}>
          Descrição
        </label>
        <input
          id="saida-descricao"
          type="text"
          required
          placeholder="Ex: compra de baralho"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          className={CAMPO_CLASSE}
        />
      </div>

      {erro && (
        <p className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex h-touch-target-min w-full items-center justify-center gap-2 rounded-full border-2 border-secondary text-label-sm font-bold uppercase tracking-wider text-secondary transition-all hover:bg-secondary hover:text-on-secondary disabled:opacity-60 md:w-auto md:self-start md:px-8"
      >
        {enviando ? (
          <IconeCarregando />
        ) : (
          <span className="material-symbols-outlined text-[20px]">add</span>
        )}
        {enviando ? "Salvando..." : "Lançar Saída"}
      </button>
    </form>
  );
}
