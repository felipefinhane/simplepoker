"use client";

import { useState, type FormEvent } from "react";

interface Jogador {
  id: number;
  nome: string;
  ativo: boolean;
  ehOrganizador: boolean;
}

export function JogadoresClient({
  jogadoresIniciais,
}: {
  jogadoresIniciais: Jogador[];
}) {
  const [jogadores, setJogadores] = useState(jogadoresIniciais);
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function cadastrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/jogadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível cadastrar.");
        return;
      }

      setJogadores((atual) =>
        [...atual, corpo.jogador].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setNovoNome("");
    } finally {
      setEnviando(false);
    }
  }

  async function renomear(id: number, nome: string) {
    setErro(null);
    const resposta = await fetch(`/api/jogadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setErro(corpo?.error ?? "Não foi possível renomear.");
      return;
    }

    setJogadores((atual) =>
      atual.map((j) => (j.id === id ? corpo.jogador : j)),
    );
  }

  async function alternarAtivo(id: number, ativo: boolean) {
    setErro(null);
    const resposta = await fetch(`/api/jogadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setErro(corpo?.error ?? "Não foi possível atualizar.");
      return;
    }

    setJogadores((atual) =>
      atual.map((j) => (j.id === id ? corpo.jogador : j)),
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form
        onSubmit={cadastrar}
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <input
          type="text"
          placeholder="Nome do novo Jogador"
          required
          value={novoNome}
          onChange={(event) => setNovoNome(event.target.value)}
        />
        <button type="submit" disabled={enviando}>
          Cadastrar
        </button>
      </form>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {jogadores.map((jogador) => (
          <li
            key={jogador.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: jogador.ativo ? 1 : 0.5,
            }}
          >
            <input
              type="text"
              defaultValue={jogador.nome}
              onBlur={(event) => {
                const nome = event.target.value.trim();
                if (nome && nome !== jogador.nome) renomear(jogador.id, nome);
              }}
              style={{ flex: 1 }}
            />
            {jogador.ehOrganizador ? (
              <span title="Organizador — não pode ser desativado por aqui">
                ⭐
              </span>
            ) : (
              <button
                type="button"
                onClick={() => alternarAtivo(jogador.id, !jogador.ativo)}
              >
                {jogador.ativo ? "Desativar" : "Reativar"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
