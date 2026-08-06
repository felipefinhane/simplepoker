"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AtualizacaoDeLancamento, Partida } from "@/lib/partidas";
import type { Jogador } from "@/lib/jogadores";

interface Premiacao {
  primeiro: number;
  segundo: number;
}

async function chamarApi(
  url: string,
  method: string,
  body?: unknown,
): Promise<{ ok: true; corpo: Record<string, unknown> } | { ok: false; erro: string }> {
  const resposta = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error ?? "Não foi possível." };
  }
  return { ok: true, corpo };
}

export function PartidaEmAndamentoClient({
  partida: partidaInicial,
  jogadoresForaDaPartida: foraInicial,
}: {
  partida: Partida;
  jogadoresForaDaPartida: Jogador[];
}) {
  const router = useRouter();
  const [partida, setPartida] = useState(partidaInicial);
  const [fora, setFora] = useState(foraInicial);
  const [data, setData] = useState(partida.data);
  const [novoParticipanteId, setNovoParticipanteId] = useState("");
  const [novoJogadorNome, setNovoJogadorNome] = useState("");
  const [saindoId, setSaindoId] = useState<number | null>(null);
  const [eliminadorEscolhido, setEliminadorEscolhido] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [premiacaoFinal, setPremiacaoFinal] = useState<Premiacao | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ativos = partida.lancamentos.filter((l) => l.posicao === null);
  const semPosicao = ativos.length;

  async function executar(url: string, method: string, body?: unknown) {
    setErro(null);
    const resultado = await chamarApi(url, method, body);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return null;
    }
    return resultado.corpo;
  }

  async function salvarData(event: FormEvent) {
    event.preventDefault();
    const corpo = await executar(`/api/partidas/${partida.id}`, "PATCH", { data });
    if (corpo) setPartida(corpo.partida as Partida);
  }

  async function adicionarExistente(event: FormEvent) {
    event.preventDefault();
    if (!novoParticipanteId) return;
    const jogadorId = Number(novoParticipanteId);
    const corpo = await executar(`/api/partidas/${partida.id}/participantes`, "POST", {
      jogadorId,
    });
    if (corpo) {
      setPartida(corpo.partida as Partida);
      setFora((atual) => atual.filter((j) => j.id !== jogadorId));
      setNovoParticipanteId("");
    }
  }

  async function cadastrarEAdicionar(event: FormEvent) {
    event.preventDefault();
    const nome = novoJogadorNome.trim();
    if (!nome) return;

    const criado = await executar("/api/jogadores", "POST", { nome });
    if (!criado) return;
    const jogador = criado.jogador as { id: number };

    const corpo = await executar(`/api/partidas/${partida.id}/participantes`, "POST", {
      jogadorId: jogador.id,
    });
    if (corpo) {
      setPartida(corpo.partida as Partida);
      setNovoJogadorNome("");
    }
  }

  async function atualizarLinha(jogadorId: number, dados: AtualizacaoDeLancamento) {
    const corpo = await executar(
      `/api/partidas/${partida.id}/lancamentos/${jogadorId}`,
      "PATCH",
      dados,
    );
    if (corpo) setPartida(corpo.partida as Partida);
  }

  async function confirmarSaida(jogadorId: number) {
    const corpo = await executar(
      `/api/partidas/${partida.id}/lancamentos/${jogadorId}/sair`,
      "POST",
      { eliminadoPorJogadorId: eliminadorEscolhido ? Number(eliminadorEscolhido) : null },
    );
    if (corpo) {
      setPartida(corpo.partida as Partida);
      setSaindoId(null);
      setEliminadorEscolhido("");
    }
  }

  async function finalizar() {
    if (!confirm("Finalizar esta Partida? Depois disso não dá mais pra editar.")) return;
    setEnviando(true);
    const corpo = await executar(`/api/partidas/${partida.id}/finalizar`, "POST");
    setEnviando(false);
    if (corpo) {
      setPremiacaoFinal(corpo.premiacao as Premiacao);
      setPartida(corpo.partida as Partida);
      router.refresh();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form onSubmit={salvarData} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label>
          Data{" "}
          <input type="date" value={data} onChange={(event) => setData(event.target.value)} />
        </label>
        <button type="submit">Salvar data</button>
      </form>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Jogador</th>
              <th>Posição</th>
              <th>Eliminado por</th>
              <th>Pagou</th>
              <th>Almas</th>
              <th>Pontos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {partida.lancamentos.map((lancamento) => (
              <tr key={`${lancamento.jogadorId}-${lancamento.posicao}`}>
                <td>{lancamento.nome}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    defaultValue={lancamento.posicao ?? ""}
                    style={{ width: "3.5rem" }}
                    onBlur={(event) => {
                      const valor = event.target.value;
                      const posicao = valor === "" ? null : Number(valor);
                      if (posicao !== lancamento.posicao) {
                        atualizarLinha(lancamento.jogadorId, { posicao });
                      }
                    }}
                  />
                </td>
                <td>
                  <select
                    value={lancamento.eliminadoPorJogadorId ?? ""}
                    onChange={(event) =>
                      atualizarLinha(lancamento.jogadorId, {
                        eliminadoPorJogadorId: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">—</option>
                    {partida.lancamentos
                      .filter((outro) => outro.jogadorId !== lancamento.jogadorId)
                      .map((outro) => (
                        <option key={outro.jogadorId} value={outro.jogadorId}>
                          {outro.nome}
                        </option>
                      ))}
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={lancamento.pagamento}
                    onChange={(event) =>
                      atualizarLinha(lancamento.jogadorId, { pagamento: event.target.checked })
                    }
                  />
                </td>
                <td style={{ textAlign: "center" }}>{lancamento.almas}</td>
                <td style={{ textAlign: "center" }}>{lancamento.pontos ?? "—"}</td>
                <td>
                  {lancamento.posicao === null &&
                    (saindoId === lancamento.jogadorId ? (
                      <span style={{ display: "flex", gap: "0.25rem" }}>
                        <select
                          value={eliminadorEscolhido}
                          onChange={(event) => setEliminadorEscolhido(event.target.value)}
                        >
                          <option value="">Quem eliminou?</option>
                          {ativos
                            .filter((a) => a.jogadorId !== lancamento.jogadorId)
                            .map((a) => (
                              <option key={a.jogadorId} value={a.jogadorId}>
                                {a.nome}
                              </option>
                            ))}
                        </select>
                        <button type="button" onClick={() => confirmarSaida(lancamento.jogadorId)}>
                          Confirmar
                        </button>
                        <button type="button" onClick={() => setSaindoId(null)}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setSaindoId(lancamento.jogadorId)}>
                        Saiu
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={adicionarExistente} style={{ display: "flex", gap: "0.5rem" }}>
        <select
          value={novoParticipanteId}
          onChange={(event) => setNovoParticipanteId(event.target.value)}
        >
          <option value="">Adicionar participante...</option>
          {fora.map((jogador) => (
            <option key={jogador.id} value={jogador.id}>
              {jogador.nome}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!novoParticipanteId}>
          Adicionar
        </button>
      </form>

      <form onSubmit={cadastrarEAdicionar} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Nome do novo Jogador"
          value={novoJogadorNome}
          onChange={(event) => setNovoJogadorNome(event.target.value)}
        />
        <button type="submit" disabled={!novoJogadorNome.trim()}>
          Cadastrar e adicionar
        </button>
      </form>

      {premiacaoFinal && (
        <p>
          Premiação: 1º R$ {premiacaoFinal.primeiro.toFixed(2)} · 2º R${" "}
          {premiacaoFinal.segundo.toFixed(2)}
        </p>
      )}

      <button
        type="button"
        onClick={finalizar}
        disabled={enviando || semPosicao > 1}
        style={{ fontWeight: "bold" }}
      >
        Finalizar Partida
      </button>
      {semPosicao > 1 && (
        <p style={{ opacity: 0.7 }}>
          Faltam {semPosicao} participantes sem posição — só é possível finalizar quando
          restar no máximo 1 (o campeão).
        </p>
      )}
    </div>
  );
}
