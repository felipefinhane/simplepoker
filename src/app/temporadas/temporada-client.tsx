"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface NivelDeBlind {
  blindPequeno: number;
  blindGrande: number;
  duracaoMinutos: number;
}

interface FichaInicial {
  valor: number;
  quantidade: number;
}

interface ParametrosSerializados {
  tabelaDePontos: [number, number][];
  valorDaPartida: number;
  multiplicadorPremiacaoPrimeiro: number;
  multiplicadorPremiacaoSegundo: number;
  estruturaDeBlinds: NivelDeBlind[];
  fichasIniciais: FichaInicial[];
}

export function TemporadaClient({
  modo,
  temporadaId,
  parametrosIniciais,
}: {
  modo: "criar" | "editar";
  temporadaId?: number;
  parametrosIniciais: ParametrosSerializados;
}) {
  const router = useRouter();
  const [tabelaDePontos, setTabelaDePontos] = useState(
    [...parametrosIniciais.tabelaDePontos].sort((a, b) => a[0] - b[0]),
  );
  const [valorDaPartida, setValorDaPartida] = useState(
    parametrosIniciais.valorDaPartida,
  );
  const [multiplicadorPrimeiro, setMultiplicadorPrimeiro] = useState(
    parametrosIniciais.multiplicadorPremiacaoPrimeiro,
  );
  const [multiplicadorSegundo, setMultiplicadorSegundo] = useState(
    parametrosIniciais.multiplicadorPremiacaoSegundo,
  );
  const [blinds, setBlinds] = useState(parametrosIniciais.estruturaDeBlinds);
  const [fichas, setFichas] = useState(parametrosIniciais.fichasIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const corpo = {
      tabelaDePontos,
      valorDaPartida,
      multiplicadorPremiacaoPrimeiro: multiplicadorPrimeiro,
      multiplicadorPremiacaoSegundo: multiplicadorSegundo,
      estruturaDeBlinds: blinds,
      fichasIniciais: fichas,
    };

    try {
      const resposta = await fetch(
        modo === "criar" ? "/api/temporadas" : `/api/temporadas/${temporadaId}`,
        {
          method: modo === "criar" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        },
      );
      const respostaCorpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(respostaCorpo?.error ?? "Não foi possível salvar.");
        return;
      }

      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function encerrar() {
    if (!temporadaId) return;
    if (!confirm("Encerrar a Temporada? Os Parâmetros ficam congelados depois disso.")) {
      return;
    }

    setErro(null);
    const resposta = await fetch(`/api/temporadas/${temporadaId}/encerrar`, {
      method: "POST",
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setErro(corpo?.error ?? "Não foi possível encerrar.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <p>
        {modo === "criar"
          ? "Nenhuma Temporada aberta — crie uma nova."
          : "Editando a Temporada aberta."}
      </p>

      <fieldset>
        <legend>Tabela de Pontos</legend>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.35rem", alignItems: "center" }}>
          {tabelaDePontos.map(([posicao, pontos], indice) => (
            <label key={posicao} style={{ display: "contents" }}>
              <span>{posicao}º</span>
              <input
                type="number"
                min={0}
                value={pontos}
                onChange={(event) => {
                  const novoValor = Number(event.target.value);
                  setTabelaDePontos((atual) =>
                    atual.map((item, i) =>
                      i === indice ? [posicao, novoValor] : item,
                    ),
                  );
                }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Valores</legend>
        <label>
          Valor da Partida (R$)
          <input
            type="number"
            min={0.01}
            step="0.01"
            required
            value={valorDaPartida}
            onChange={(event) => setValorDaPartida(Number(event.target.value))}
          />
        </label>
        <label>
          Multiplicador de premiação — 1º lugar
          <input
            type="number"
            min={0}
            step="0.1"
            required
            value={multiplicadorPrimeiro}
            onChange={(event) => setMultiplicadorPrimeiro(Number(event.target.value))}
          />
        </label>
        <label>
          Multiplicador de premiação — 2º lugar
          <input
            type="number"
            min={0}
            step="0.1"
            required
            value={multiplicadorSegundo}
            onChange={(event) => setMultiplicadorSegundo(Number(event.target.value))}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Estrutura de Blinds</legend>
        {blinds.map((nivel, indice) => (
          <div key={indice} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <input
              type="number"
              min={1}
              placeholder="Blind pequeno"
              value={nivel.blindPequeno}
              onChange={(event) =>
                setBlinds((atual) =>
                  atual.map((n, i) =>
                    i === indice ? { ...n, blindPequeno: Number(event.target.value) } : n,
                  ),
                )
              }
            />
            <input
              type="number"
              min={1}
              placeholder="Blind grande"
              value={nivel.blindGrande}
              onChange={(event) =>
                setBlinds((atual) =>
                  atual.map((n, i) =>
                    i === indice ? { ...n, blindGrande: Number(event.target.value) } : n,
                  ),
                )
              }
            />
            <input
              type="number"
              min={1}
              placeholder="Duração (min)"
              value={nivel.duracaoMinutos}
              onChange={(event) =>
                setBlinds((atual) =>
                  atual.map((n, i) =>
                    i === indice ? { ...n, duracaoMinutos: Number(event.target.value) } : n,
                  ),
                )
              }
            />
            <button type="button" onClick={() => setBlinds((atual) => atual.filter((_, i) => i !== indice))}>
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setBlinds((atual) => [...atual, { blindPequeno: 1, blindGrande: 2, duracaoMinutos: 15 }])
          }
        >
          + Nível de blind
        </button>
      </fieldset>

      <fieldset>
        <legend>Fichas Iniciais</legend>
        {fichas.map((ficha, indice) => (
          <div key={indice} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <input
              type="number"
              min={1}
              placeholder="Valor da ficha"
              value={ficha.valor}
              onChange={(event) =>
                setFichas((atual) =>
                  atual.map((f, i) => (i === indice ? { ...f, valor: Number(event.target.value) } : f)),
                )
              }
            />
            <input
              type="number"
              min={1}
              placeholder="Quantidade"
              value={ficha.quantidade}
              onChange={(event) =>
                setFichas((atual) =>
                  atual.map((f, i) => (i === indice ? { ...f, quantidade: Number(event.target.value) } : f)),
                )
              }
            />
            <button type="button" onClick={() => setFichas((atual) => atual.filter((_, i) => i !== indice))}>
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFichas((atual) => [...atual, { valor: 100, quantidade: 10 }])}
        >
          + Ficha
        </button>
      </fieldset>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" disabled={enviando}>
          {modo === "criar" ? "Criar Temporada" : "Salvar Parâmetros"}
        </button>
        {modo === "editar" && (
          <button type="button" onClick={encerrar}>
            Encerrar Temporada
          </button>
        )}
      </div>
    </form>
  );
}
