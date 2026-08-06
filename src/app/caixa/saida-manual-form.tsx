"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
    <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "320px" }}>
      <label>
        Data
        <input
          type="date"
          required
          value={data}
          onChange={(event) => setData(event.target.value)}
        />
      </label>
      <label>
        Descrição
        <input
          type="text"
          required
          placeholder="Ex: compra de baralho"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
        />
      </label>
      <label>
        Valor (R$)
        <input
          type="number"
          min={0.01}
          step="0.01"
          required
          value={valor}
          onChange={(event) => setValor(event.target.value)}
        />
      </label>
      {erro && <p style={{ color: "crimson" }}>{erro}</p>}
      <button type="submit" disabled={enviando}>
        {enviando ? "Salvando..." : "Lançar saída"}
      </button>
    </form>
  );
}
