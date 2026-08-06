"use client";

import { useState, type FormEvent } from "react";

interface LancamentoDaPartida {
  jogadorId: number;
  nome: string;
  posicao: number | null;
  almas: number;
  pagamento: boolean;
  pontos: number | null;
}

interface Partida {
  id: number;
  temporadaId: number;
  data: string;
  lancamentos: LancamentoDaPartida[];
}

interface Premiacao {
  primeiro: number;
  segundo: number;
}

export function LancamentoClient({ partida: partidaInicial }: { partida: Partida }) {
  const [lancamentos, setLancamentos] = useState(partidaInicial.lancamentos);
  const [premiacao, setPremiacao] = useState<Premiacao | null>(null);
  const [entradaNoCaixa, setEntradaNoCaixa] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function atualizar(jogadorId: number, campo: "posicao" | "almas" | "pagamento", valor: number | boolean) {
    setLancamentos((atual) =>
      atual.map((l) => (l.jogadorId === jogadorId ? { ...l, [campo]: valor } : l)),
    );
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch(`/api/partidas/${partidaInicial.id}/lancamentos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entradas: lancamentos.map((l) => ({
            jogadorId: l.jogadorId,
            posicao: Number(l.posicao),
            almas: Number(l.almas),
            pagamento: l.pagamento,
          })),
        }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível salvar o resultado.");
        return;
      }

      setLancamentos(corpo.partida.lancamentos);
      setPremiacao(corpo.premiacao);
      setEntradaNoCaixa(corpo.entradaNoCaixa);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Jogador</th>
            <th>Posição</th>
            <th>Almas</th>
            <th>Pagou</th>
            <th>Pontos</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map((lancamento) => (
            <tr key={lancamento.jogadorId}>
              <td>{lancamento.nome}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  required
                  value={lancamento.posicao ?? ""}
                  onChange={(event) =>
                    atualizar(lancamento.jogadorId, "posicao", Number(event.target.value))
                  }
                  style={{ width: "4rem" }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={lancamento.almas}
                  onChange={(event) =>
                    atualizar(lancamento.jogadorId, "almas", Number(event.target.value))
                  }
                  style={{ width: "4rem" }}
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={lancamento.pagamento}
                  onChange={(event) =>
                    atualizar(lancamento.jogadorId, "pagamento", event.target.checked)
                  }
                />
              </td>
              <td style={{ textAlign: "center" }}>{lancamento.pontos ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      {premiacao && entradaNoCaixa !== null && (
        <p>
          Premiação: 1º R$ {premiacao.primeiro.toFixed(2)} · 2º R${" "}
          {premiacao.segundo.toFixed(2)} — Entrada no Caixa: R${" "}
          {entradaNoCaixa.toFixed(2)}
        </p>
      )}

      <button type="submit" disabled={enviando}>
        {enviando ? "Salvando..." : "Salvar resultado"}
      </button>
    </form>
  );
}
