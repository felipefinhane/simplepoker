"use client";

import { useEffect, useState } from "react";
import { IconeCarregando } from "./icone-carregando";
import { compararJogadoresPorAtivoENome } from "@/lib/ordenar-jogadores";

interface JogadorResumo {
  id: number;
  nome: string;
  ativo: boolean;
  ehOrganizador: boolean;
}

/**
 * Ativar/desativar um Jogador sem sair da tela de Partida (nova ou em
 * andamento) — redirecionar pro CRUD completo (`/jogadores`) perderia o
 * contexto (data escolhida, participantes já marcados). Busca a lista
 * completa (`GET /api/jogadores`, ativos e inativos) só quando abre, e
 * avisa o componente pai (`onAtualizarAtivos`) sempre que algo muda, pra
 * ele atualizar a lista de "Jogador já cadastrado" na hora.
 */
export function ModalGerenciarJogadores({
  aberto,
  onFechar,
  onAtualizarAtivos,
}: {
  aberto: boolean;
  onFechar: () => void;
  onAtualizarAtivos: (jogadoresAtivos: { id: number; nome: string }[]) => void;
}) {
  // `null` cobre "carregando" (ainda não buscou nada) — o modal fica
  // montado entre um "abrir" e outro (só troca `aberto`), então depois da
  // primeira busca bem-sucedida ele nunca mais volta a `null`: reabrir
  // mostra a última lista na hora e atualiza sozinho em segundo plano, em
  // vez de piscar um spinner de novo toda vez.
  const [jogadores, setJogadores] = useState<JogadorResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [alternandoId, setAlternandoId] = useState<number | null>(null);

  useEffect(() => {
    if (!aberto) return;
    // `setState` só dentro do `.then()`/`.catch()` (não direto no corpo
    // do efeito) — assíncrono de verdade, não dispara o lint
    // `react-hooks/set-state-in-effect` (mesmo ajuste do ticket 39).
    let cancelado = false;
    fetch("/api/jogadores")
      .then((resposta) => resposta.json())
      .then((corpo) => {
        if (cancelado) return;
        setJogadores(corpo.jogadores);
        setErro(null);
      })
      .catch(() => {
        if (!cancelado) setErro("Não foi possível carregar os Jogadores.");
      });
    return () => {
      cancelado = true;
    };
  }, [aberto]);

  async function alternar(id: number, ativo: boolean) {
    if (!jogadores) return;
    setErro(null);
    setAlternandoId(id);
    // Otimista — mesmo motivo do toggle em /jogadores (ticket 41): sem
    // isso, o switch pisca esperando a resposta do servidor.
    const anterior = jogadores;
    setJogadores(jogadores.map((j) => (j.id === id ? { ...j, ativo } : j)));

    try {
      const resposta = await fetch(`/api/jogadores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo }),
      });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setJogadores(anterior);
        setErro(corpo?.error ?? "Não foi possível atualizar.");
        return;
      }

      const atualizados = jogadores.map((j) => (j.id === id ? corpo.jogador : j));
      setJogadores(atualizados);
      onAtualizarAtivos(
        atualizados.filter((j) => j.ativo).map((j) => ({ id: j.id, nome: j.nome })),
      );
    } finally {
      setAlternandoId(null);
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-surface-container-lowest/80 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container shadow-2xl"
        role="dialog"
        aria-labelledby="modal-gerenciar-jogadores-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-container-high p-4">
          <h2 id="modal-gerenciar-jogadores-titulo" className="text-headline-md text-on-surface">
            Gerenciar Jogadores
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {erro && (
            <p className="mb-3 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-body-md text-error">
              {erro}
            </p>
          )}

          {jogadores === null ? (
            <div className="flex justify-center py-10">
              <IconeCarregando tamanho={32} className="text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...jogadores].sort(compararJogadoresPorAtivoENome).map((jogador) => (
                <div
                  key={jogador.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-opacity ${
                    jogador.ativo
                      ? "border-outline-variant/30 bg-surface-container-low"
                      : "border-outline-variant/10 bg-surface-container-lowest opacity-60"
                  }`}
                >
                  <span
                    className={`text-body-md ${jogador.ativo ? "text-on-surface" : "text-on-surface-variant"}`}
                  >
                    {jogador.nome}
                    {jogador.ehOrganizador && (
                      <span
                        className="material-symbols-outlined ml-1 align-middle text-sm text-secondary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        title="Organizador"
                      >
                        star
                      </span>
                    )}
                  </span>
                  {jogador.ehOrganizador ? (
                    <span className="shrink-0 text-label-sm text-on-surface-variant">
                      Sempre ativo
                    </span>
                  ) : (
                    <label
                      className="relative inline-flex shrink-0 cursor-pointer items-center"
                      aria-label={jogador.ativo ? `Desativar ${jogador.nome}` : `Reativar ${jogador.nome}`}
                    >
                      <input
                        type="checkbox"
                        checked={jogador.ativo}
                        disabled={alternandoId === jogador.id}
                        onChange={(event) => alternar(jogador.id, event.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-surface-variant transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-primary-container peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
