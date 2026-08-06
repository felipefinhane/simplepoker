"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Jogador {
  id: number;
  nome: string;
}

export function NovaPartidaClient({
  jogadoresAtivos,
}: {
  jogadoresAtivos: Jogador[];
}) {
  const router = useRouter();
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function alternar(jogadorId: number) {
    setSelecionados((atual) =>
      atual.includes(jogadorId)
        ? atual.filter((id) => id !== jogadorId)
        : [...atual, jogadorId],
    );
  }

  async function criar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/partidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, jogadorIds: selecionados }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível criar a Partida.");
        return;
      }

      router.push(`/partidas/${corpo.partida.id}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={criar} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label>
        Data
        <input
          type="date"
          required
          value={data}
          onChange={(event) => setData(event.target.value)}
        />
      </label>

      <fieldset>
        <legend>Participantes ({selecionados.length} selecionados)</legend>
        {jogadoresAtivos.map((jogador) => (
          <label key={jogador.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selecionados.includes(jogador.id)}
              onChange={() => alternar(jogador.id)}
            />{" "}
            {jogador.nome}
          </label>
        ))}
        {jogadoresAtivos.length === 0 && <p>Nenhum Jogador ativo cadastrado ainda.</p>}
      </fieldset>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      <button type="submit" disabled={enviando}>
        Criar Partida
      </button>
    </form>
  );
}
