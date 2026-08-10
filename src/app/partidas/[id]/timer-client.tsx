"use client";

import Link from "next/link";
import { IconeCarregando } from "@/components/icone-carregando";
import { BotaoNotificacao } from "./botao-notificacao";
import { BotaoPlayPause } from "./botao-play-pause";
import { MENSAGEM_SEM_ESTRUTURA_DE_BLINDS, formatarTempo, useTimer } from "./use-timer";

/**
 * Card compacto do Timer, embutido na tela da Partida — controles rápidos
 * (voltar/pausar-iniciar/pular nível) e um link pra tela cheia (`/timer`),
 * onde ficam os controles menos usados (reiniciar/encerrar) e o mostrador
 * grande pra deixar o celular apoiado na mesa.
 */
export function TimerClient({
  partidaId,
  podeControlar,
}: {
  partidaId: number;
  podeControlar: boolean;
}) {
  const { estado, erro, nivelMudouAgora, acaoEmAndamento, executarAcao } = useTimer(partidaId);

  if (!estado) return null;

  if (!estado.nivelAtual) {
    return (
      <p className="mb-section-margin text-body-md text-on-surface-variant">
        {MENSAGEM_SEM_ESTRUTURA_DE_BLINDS}
      </p>
    );
  }

  return (
    <div
      className={`felt-glow relative mb-section-margin flex flex-col overflow-hidden rounded-xl border bg-primary-container p-6 text-center transition-colors ${
        nivelMudouAgora ? "border-secondary" : "border-outline-variant/30"
      }`}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 select-none text-9xl font-black text-on-primary opacity-10">
        ♠
      </div>

      {/* Linha própria, fora do Link abaixo — botão dentro de link
          aninhado é HTML inválido e faria o toque navegar pra tela cheia
          sem querer. */}
      <div className="z-20 flex w-full justify-end">
        <BotaoNotificacao partidaId={partidaId} sobreFundoEscuro />
      </div>

      <Link href={`/partidas/${partidaId}/timer`} className="z-10 flex flex-col items-center">
        <div className="flex w-full items-center justify-between">
          <span className="text-label-sm uppercase tracking-widest text-primary">
            Nível {estado.nivel + 1} de {estado.totalDeNiveis}
          </span>
          <span className="material-symbols-outlined text-primary/70">open_in_full</span>
        </div>

        <h3 className="mb-1 text-body-lg text-on-primary">
          Blinds{" "}
          <span className="font-bold text-white">
            {estado.nivelAtual.blindPequeno}/{estado.nivelAtual.blindGrande}
          </span>
        </h3>

        <div className="my-4 text-display-score tabular-nums tracking-tighter text-white">
          {formatarTempo(estado.segundosRestantes)}
        </div>

        {estado.proximoNivel && (
          <div className="mb-2 text-label-data text-primary/80">
            Próximo Nível: {estado.proximoNivel.blindPequeno}/{estado.proximoNivel.blindGrande}
          </div>
        )}
      </Link>

      {erro && <p className="z-10 mb-2 text-body-md text-error">{erro}</p>}

      {estado.encerrado ? (
        <p className="z-10 mt-2 text-label-data text-primary/80">Timer encerrado.</p>
      ) : (
        podeControlar && (
          <div className="z-10 mt-4 flex w-full items-center justify-center gap-8 rounded-full border border-white/5 bg-surface-container-low/50 p-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => executarAcao("voltar-nivel")}
              disabled={estado.nivel === 0 || acaoEmAndamento !== null}
              aria-label="Voltar nível"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/40 text-on-surface transition-colors hover:bg-surface/80 disabled:opacity-30"
            >
              {acaoEmAndamento === "voltar-nivel" ? (
                <IconeCarregando />
              ) : (
                <span className="material-symbols-outlined">skip_previous</span>
              )}
            </button>
            <BotaoPlayPause
              rodando={estado.rodando}
              tamanho="compacto"
              carregando={acaoEmAndamento === "iniciar" || acaoEmAndamento === "pausar"}
              desabilitado={acaoEmAndamento !== null}
              onClick={() => executarAcao(estado.rodando ? "pausar" : "iniciar")}
            />
            <button
              type="button"
              onClick={() => executarAcao("pular-nivel")}
              disabled={!estado.proximoNivel || acaoEmAndamento !== null}
              aria-label="Pular nível"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/40 text-on-surface transition-colors hover:bg-surface/80 disabled:opacity-30"
            >
              {acaoEmAndamento === "pular-nivel" ? (
                <IconeCarregando />
              ) : (
                <span className="material-symbols-outlined">skip_next</span>
              )}
            </button>
          </div>
        )
      )}
    </div>
  );
}
