"use client";

import Link from "next/link";
import { BotaoNotificacao } from "../botao-notificacao";
import { BotaoPlayPause } from "../botao-play-pause";
import { MENSAGEM_SEM_ESTRUTURA_DE_BLINDS, formatarTempo, useTimer } from "../use-timer";

function ControleDeIcone({
  icone,
  rotulo,
  onClick,
  disabled,
}: {
  icone: string;
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      className="group flex flex-col items-center justify-center text-on-surface-variant transition-colors hover:text-primary disabled:opacity-30"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface transition-colors group-hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[28px]">{icone}</span>
      </div>
      <span className="mt-1 text-label-sm">{rotulo}</span>
    </button>
  );
}

/**
 * Timer em tela cheia — pensado pra deixar o celular apoiado na mesa como
 * um relógio de torneio: números enormes, poucos elementos. Reiniciar e
 * Encerrar (menos usados, mais arriscados) só existem aqui, não no card
 * compacto (`../timer-client.tsx`).
 */
export function TimerTelaCheiaClient({
  partidaId,
  podeControlar,
}: {
  partidaId: number;
  podeControlar: boolean;
}) {
  const { estado, erro, executarAcao, executarAcaoComConfirmacao } = useTimer(partidaId);

  if (!estado) return null;

  if (!estado.nivelAtual) {
    return (
      <div className="flex flex-col items-center gap-4 px-container-padding py-12 text-center">
        <p className="text-body-md text-on-surface-variant">{MENSAGEM_SEM_ESTRUTURA_DE_BLINDS}</p>
        <Link href={`/partidas/${partidaId}`} className="text-primary hover:underline">
          ← Voltar pra Partida
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-section-margin px-container-padding py-10 text-center"
      style={{ background: "radial-gradient(circle at center, #0f5132 0%, #0a0b0c 100%)" }}
    >
      <div className="flex w-full items-center justify-between">
        <Link
          href={`/partidas/${partidaId}`}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Voltar
        </Link>
        <BotaoNotificacao partidaId={partidaId} />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-surface/40 px-6 py-2 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        <span className="text-label-data uppercase tracking-widest text-secondary">
          Nível {estado.nivel + 1} de {estado.totalDeNiveis}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="mb-2 text-body-md text-on-surface-variant">
          Blinds Atuais (SB / BB)
        </span>
        <div
          className="text-[5rem] font-extrabold leading-none tracking-tighter text-primary"
          style={{ textShadow: "0 0 20px rgba(149,212,172,0.3)" }}
        >
          {estado.nivelAtual.blindPequeno}{" "}
          <span className="mx-2 font-light text-on-surface-variant">/</span>{" "}
          {estado.nivelAtual.blindGrande}
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center py-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-secondary/5 blur-3xl" />
        <div
          className="text-[6rem] font-black leading-none tabular-nums tracking-tighter text-secondary sm:text-[8rem]"
          style={{ textShadow: "0 0 40px rgba(233,195,73,0.4)" }}
        >
          {formatarTempo(estado.segundosRestantes)}
        </div>
      </div>

      {estado.proximoNivel && (
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-outline-variant/30 bg-surface-container/60 p-6 shadow-lg backdrop-blur-md">
          <span className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
            Próximo Nível
          </span>
          <div className="text-headline-md text-on-surface">
            {estado.proximoNivel.blindPequeno}{" "}
            <span className="mx-1 text-on-surface-variant">/</span>{" "}
            {estado.proximoNivel.blindGrande}
          </div>
        </div>
      )}

      {erro && <p className="text-body-md text-error">{erro}</p>}

      {estado.encerrado ? (
        <p className="text-label-data text-on-surface-variant">Timer encerrado.</p>
      ) : (
        podeControlar && (
          <div className="flex w-full max-w-md items-center justify-around">
            <ControleDeIcone
              icone="replay"
              rotulo="Reiniciar"
              onClick={() =>
                executarAcaoComConfirmacao(
                  "reiniciar",
                  "Reiniciar o Timer? Volta pro nível 1 com o tempo cheio.",
                )
              }
            />
            <ControleDeIcone
              icone="skip_previous"
              rotulo="Voltar"
              onClick={() => executarAcao("voltar-nivel")}
              disabled={estado.nivel === 0}
            />
            <BotaoPlayPause
              rodando={estado.rodando}
              tamanho="grande"
              onClick={() => executarAcao(estado.rodando ? "pausar" : "iniciar")}
            />
            <ControleDeIcone
              icone="skip_next"
              rotulo="Pular"
              onClick={() => executarAcao("pular-nivel")}
              disabled={!estado.proximoNivel}
            />
            <ControleDeIcone
              icone="lock"
              rotulo="Encerrar"
              onClick={() =>
                executarAcaoComConfirmacao(
                  "encerrar",
                  "Encerrar o Timer? Depois disso não dá mais pra controlar.",
                )
              }
            />
          </div>
        )
      )}
    </div>
  );
}
