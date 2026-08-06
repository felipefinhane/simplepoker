"use client";

import { useEffect, useRef, useState } from "react";
import type { EstadoDoTimer } from "@/lib/timer";

const INTERVALO_DE_POLLING_MS = 3000;
const DURACAO_DO_ALERTA_VISUAL_MS = 4000;

/** Beep curto via Web Audio — sem depender de nenhum arquivo de áudio. */
function tocarAlerta() {
  try {
    const AudioContextClasse =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const contexto = new AudioContextClasse();
    const oscilador = contexto.createOscillator();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    oscilador.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.3);
  } catch {
    // Navegador sem suporte a Web Audio — segue sem som.
  }
}

export function formatarTempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${resto.toString().padStart(2, "0")}`;
}

/** Mostrada tanto no card compacto quanto na tela cheia do Timer. */
export const MENSAGEM_SEM_ESTRUTURA_DE_BLINDS =
  "Esta Temporada não tem Estrutura de Blinds configurada — o timer não pode ser usado.";

/**
 * Estado do Timer (com polling) e as ações de controle — usado tanto pelo
 * card compacto (`TimerClient`, embutido na Partida) quanto pela tela cheia
 * (`timer/timer-tela-cheia-client.tsx`), que só diferem no layout.
 */
export function useTimer(partidaId: number) {
  const [estado, setEstado] = useState<EstadoDoTimer | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [nivelMudouAgora, setNivelMudouAgora] = useState(false);
  const nivelAnteriorRef = useRef<number | null>(null);

  function avisarMudancaDeNivel() {
    tocarAlerta();
    setNivelMudouAgora(true);
    setTimeout(() => setNivelMudouAgora(false), DURACAO_DO_ALERTA_VISUAL_MS);
  }

  useEffect(() => {
    let cancelado = false;

    async function buscarEstado() {
      const resposta = await fetch(`/api/partidas/${partidaId}/timer`);
      if (!resposta.ok || cancelado) return;
      const corpo: EstadoDoTimer = await resposta.json();

      if (nivelAnteriorRef.current !== null && corpo.nivel !== nivelAnteriorRef.current) {
        avisarMudancaDeNivel();
      }
      nivelAnteriorRef.current = corpo.nivel;
      setEstado(corpo);
    }

    buscarEstado();
    const intervalo = setInterval(buscarEstado, INTERVALO_DE_POLLING_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [partidaId]);

  // Contagem local entre um poll e outro, pra não ficar "pulando" de 3 em
  // 3 segundos — o próximo poll sempre corrige qualquer deriva.
  useEffect(() => {
    if (!estado?.rodando) return;
    const intervalo = setInterval(() => {
      setEstado((atual) =>
        atual && atual.segundosRestantes > 0
          ? { ...atual, segundosRestantes: atual.segundosRestantes - 1 }
          : atual,
      );
    }, 1000);
    return () => clearInterval(intervalo);
  }, [estado?.rodando, estado?.nivel]);

  async function executarAcao(caminho: string) {
    setErro(null);
    const resposta = await fetch(`/api/partidas/${partidaId}/timer/${caminho}`, {
      method: "POST",
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      setErro(corpo?.error ?? "Não foi possível.");
      return;
    }
    if (nivelAnteriorRef.current !== null && corpo.nivel !== nivelAnteriorRef.current) {
      avisarMudancaDeNivel();
    }
    nivelAnteriorRef.current = corpo.nivel;
    setEstado(corpo);
  }

  async function executarAcaoComConfirmacao(caminho: string, mensagem: string) {
    if (!confirm(mensagem)) return;
    await executarAcao(caminho);
  }

  return { estado, erro, nivelMudouAgora, executarAcao, executarAcaoComConfirmacao };
}
