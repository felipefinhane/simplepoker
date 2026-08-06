import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { buscarTemporadaAberta } from "@/lib/temporadas";
import { calcularSaldoDaTemporada, listarTransacoesDaTemporada } from "@/lib/caixa";
import { SaidaManualForm } from "./saida-manual-form";

export default async function CaixaPage() {
  const temporada = await buscarTemporadaAberta();

  if (!temporada) {
    return (
      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
        <h1>Caixa</h1>
        <p>Nenhuma Temporada aberta no momento.</p>
      </main>
    );
  }

  const [transacoes, saldo, organizador] = await Promise.all([
    listarTransacoesDaTemporada(temporada.id),
    calcularSaldoDaTemporada(temporada.id),
    getOrganizadorLogado(),
  ]);

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem" }}>
      <h1>Caixa</h1>
      <p>
        Saldo atual: <strong>R$ {saldo.toFixed(2)}</strong>
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Data</th>
              <th style={{ textAlign: "left" }}>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((transacao) => (
              <tr key={transacao.id}>
                <td>{transacao.data}</td>
                <td>
                  {transacao.tipo === "entrada_partida"
                    ? "Entrada — resultado de Partida"
                    : transacao.descricao}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    color: transacao.tipo === "saida_manual" ? "crimson" : "inherit",
                  }}
                >
                  {transacao.tipo === "saida_manual" ? "− " : "+ "}
                  R$ {transacao.valor.toFixed(2)}
                </td>
              </tr>
            ))}
            {transacoes.length === 0 && (
              <tr>
                <td colSpan={3}>Nenhuma movimentação ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {organizador && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Lançar saída</h2>
          <SaidaManualForm temporadaId={temporada.id} />
        </div>
      )}
    </main>
  );
}
