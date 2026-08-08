"use client";

import { useEffect, useRef, useState } from "react";
import type { EstadoDoTimer } from "@/lib/timer";

const INTERVALO_DE_POLLING_MS = 3000;
const DURACAO_DO_ALERTA_VISUAL_MS = 4000;

function obterAudioContextClasse() {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  );
}

// Reaproveitado entre trocas de nível — criar um `AudioContext` novo a cada
// beep (como era antes) nasce "suspended" em iOS/Android sempre que a
// chamada não vem de dentro de um toque do usuário, e a troca de nível
// quase sempre acontece sozinha (polling em segundo plano, ver ticket 36),
// nunca de um clique — o som falhava calado, sem erro nenhum. Em vez
// disso, um único contexto é criado (ou destravado) no primeiro toque na
// página (ver `destravarAudioNoProximoToque`) e reaproveitado depois.
let audioContextCompartilhado: AudioContext | null = null;

function obterOuCriarAudioContextCompartilhado(): AudioContext | null {
  const AudioContextClasse = obterAudioContextClasse();
  if (!AudioContextClasse) return null;
  if (!audioContextCompartilhado) {
    audioContextCompartilhado = new AudioContextClasse();
  }
  return audioContextCompartilhado;
}

/**
 * Destrava o áudio assim que o usuário tocar em qualquer lugar da página —
 * só funciona uma vez de verdade (as seguintes são só o `.resume()` de
 * segurança, caso o navegador tenha suspendido o contexto de novo ao
 * colocar a aba em segundo plano). Chamado uma vez por instância do
 * `useTimer` (ver efeito abaixo).
 */
function destravarAudioNoProximoToque() {
  function destravar() {
    const contexto = obterOuCriarAudioContextCompartilhado();
    contexto?.resume().catch(() => {
      // Sem suporte, ou o navegador recusou — segue sem som.
    });
  }
  window.addEventListener("pointerdown", destravar);
  window.addEventListener("keydown", destravar);
  return () => {
    window.removeEventListener("pointerdown", destravar);
    window.removeEventListener("keydown", destravar);
  };
}

/** Beep curto via Web Audio — sem depender de nenhum arquivo de áudio. */
function tocarAlerta() {
  try {
    const contexto = obterOuCriarAudioContextCompartilhado();
    if (!contexto) return;
    // Se o navegador suspendeu de novo (ex: aba voltou do segundo plano),
    // isso não pede um gesto novo — só reativa um contexto já destravado
    // antes por um toque real.
    void contexto.resume();
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

  useEffect(() => destravarAudioNoProximoToque(), []);

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
