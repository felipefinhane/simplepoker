import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { buscarTemporadaAberta } from "@/lib/temporadas";
import { calcularSaldoDaTemporada, listarTransacoesDaTemporada } from "@/lib/caixa";
import { SaidaManualForm } from "./saida-manual-form";

function formatarData(data: string): string {
  const [, mes, dia] = data.split("-");
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${dia} ${meses[Number(mes) - 1]}`;
}

function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CaixaPage() {
  const temporada = await buscarTemporadaAberta();

  if (!temporada) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
        <h1 className="text-headline-lg text-on-surface">Caixa</h1>
        <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
          Nenhuma Temporada aberta no momento.
        </p>
      </main>
    );
  }

  const [transacoes, saldo, organizador] = await Promise.all([
    listarTransacoesDaTemporada(temporada.id),
    calcularSaldoDaTemporada(temporada.id),
    getOrganizadorLogado(),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      {/* Saldo do Caixa */}
      <section className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-container opacity-20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-secondary opacity-10 blur-2xl" />
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
            Saldo do Caixa
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-headline-md text-secondary">R$</span>
            <h2 className="text-display-score text-secondary">{formatarValor(saldo)}</h2>
          </div>
        </div>
      </section>

      {/* Extrato */}
      <section className="flex flex-col gap-stack-gap">
        <div className="flex items-end justify-between">
          <h3 className="text-headline-md text-on-surface">Histórico</h3>
          <span className="text-label-sm text-on-surface-variant">
            {transacoes.length} lançamento{transacoes.length === 1 ? "" : "s"}
          </span>
        </div>

        {transacoes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-variant">
            Nenhuma movimentação ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transacoes.map((transacao) => {
              const entrada = transacao.tipo === "entrada_partida";
              return (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-surface-container-high bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                        entrada
                          ? "bg-primary-container/20 text-primary"
                          : "bg-error-container/20 text-error"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {entrada ? "arrow_downward" : "arrow_upward"}
                      </span>
                    </div>
                    <div>
                      <p className="text-body-md text-on-surface">
                        {entrada ? "Entrada — resultado de Partida" : transacao.descricao}
                      </p>
                      <p className="text-label-data text-on-surface-variant">
                        {formatarData(transacao.data)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`shrink-0 text-label-data ${entrada ? "text-primary" : "text-error"}`}
                  >
                    {entrada ? "+" : "−"} R$ {formatarValor(transacao.valor)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {organizador && (
        <section className="rounded-xl border border-surface-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-headline-md text-on-surface">
            <span className="material-symbols-outlined text-secondary">remove_circle</span>
            Lançar Saída
          </h3>
          <SaidaManualForm temporadaId={temporada.id} />
        </section>
      )}
    </main>
  );
}
