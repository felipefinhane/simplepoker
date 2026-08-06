import { db, withTransaction } from "@/lib/db";
import { TemporadaEncerradaError } from "@/lib/temporadas";

/** Uma entrada no extrato do Caixa. Ver CONTEXT.md. */
export interface TransacaoDoCaixa {
  id: number;
  tipo: "entrada_partida" | "saida_manual";
  valor: number;
  data: string;
  /** Data da Partida de origem, só para tipo = entrada_partida. */
  partidaId: number | null;
  /** Só para tipo = saida_manual. */
  descricao: string | null;
}

export class DadosDaSaidaInvalidosError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "DadosDaSaidaInvalidosError";
  }
}

interface LinhaTransacao {
  id: number;
  tipo: "entrada_partida" | "saida_manual";
  valor: string;
  data: string;
  partida_id: number | null;
  descricao: string | null;
}

function linhaParaTransacao(linha: LinhaTransacao): TransacaoDoCaixa {
  return {
    id: linha.id,
    tipo: linha.tipo,
    valor: Number(linha.valor),
    data: linha.data,
    partidaId: linha.partida_id,
    descricao: linha.descricao,
  };
}

/** Extrato completo da Temporada, mais recente primeiro. */
export async function listarTransacoesDaTemporada(
  temporadaId: number,
): Promise<TransacaoDoCaixa[]> {
  const { rows } = await db.query<LinhaTransacao>(
    `SELECT id, tipo, valor, to_char(data, 'YYYY-MM-DD') AS data, partida_id, descricao
     FROM caixa_transacoes
     WHERE temporada_id = $1
     ORDER BY caixa_transacoes.data DESC, id DESC`,
    [temporadaId],
  );
  return rows.map(linhaParaTransacao);
}

/**
 * Saldo do Caixa = soma das entradas automáticas − soma das saídas
 * manuais. Ver CONTEXT.md.
 */
export async function calcularSaldoDaTemporada(
  temporadaId: number,
): Promise<number> {
  const { rows } = await db.query<{ saldo: string | null }>(
    `SELECT SUM(CASE WHEN tipo = 'entrada_partida' THEN valor ELSE -valor END) AS saldo
     FROM caixa_transacoes
     WHERE temporada_id = $1`,
    [temporadaId],
  );
  return Number(rows[0]?.saldo ?? 0);
}

/**
 * Lança uma saída manual do Caixa (compra de baralho, prêmio de fim de
 * Temporada, confraternização — ver CONTEXT.md). Só permitido enquanto a
 * Temporada estiver aberta.
 */
export async function lancarSaidaManual(
  temporadaId: number,
  dados: { data: string; descricao: string; valor: number },
): Promise<TransacaoDoCaixa> {
  if (!dados.descricao.trim()) {
    throw new DadosDaSaidaInvalidosError("Informe uma descrição para a saída.");
  }
  if (!(dados.valor > 0)) {
    throw new DadosDaSaidaInvalidosError("O valor precisa ser maior que zero.");
  }
  if (!dados.data) {
    throw new DadosDaSaidaInvalidosError("Informe a data da saída.");
  }

  const linha = await withTransaction(async (client) => {
    // `FOR UPDATE` trava a linha da Temporada até o fim da transação —
    // mesma técnica de `lancarResultado` (ticket 06), pra fechar a
    // corrida entre "checar se está aberta" e "gravar a saída" contra um
    // `encerrarTemporada` concorrente.
    const { rows: temporadaRows } = await client.query<{ aberta: boolean }>(
      `SELECT aberta FROM temporadas WHERE id = $1 FOR UPDATE`,
      [temporadaId],
    );
    if (!temporadaRows[0]) {
      throw new Error(`Temporada ${temporadaId} não encontrada.`);
    }
    if (!temporadaRows[0].aberta) {
      throw new TemporadaEncerradaError();
    }

    const { rows } = await client.query<LinhaTransacao>(
      `INSERT INTO caixa_transacoes (temporada_id, tipo, valor, data, descricao)
       VALUES ($1, 'saida_manual', $2, $3, $4)
       RETURNING id, tipo, valor, to_char(data, 'YYYY-MM-DD') AS data, partida_id, descricao`,
      [temporadaId, dados.valor, dados.data, dados.descricao.trim()],
    );
    return rows[0];
  });

  return linhaParaTransacao(linha);
}
