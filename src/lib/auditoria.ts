import type { PoolClient } from "pg";
import { db } from "@/lib/db";

/**
 * Log de atividade (ticket 44) — histórico completo das ações mais
 * sensíveis do app, não só "quem foi o último a mexer" (isso já é
 * coberto pelas colunas `criado_por_jogador_id`/`atualizado_por_jogador_id`
 * direto nas tabelas principais). Pensado pra reconstituir uma disputa
 * ("quem mudou minha posição de 3 pra 5?") ou auditar uma ação sensível
 * (promover/rebaixar Organizador, mexer no Caixa).
 *
 * Deliberadamente NÃO loga: controles do Timer (pausar/iniciar/pular
 * nível), toggle de Pagou, criação/edição de Jogador comum, adicionar
 * participante — alta frequência, baixo valor de auditoria. Ver ticket 44.
 */
export type AcaoDeAuditoria =
  | "jogador.promovido"
  | "jogador.rebaixado"
  | "lancamento.atualizado"
  | "caixa.saida_manual_lancada"
  | "temporada.encerrada"
  | "temporada.reaberta"
  | "temporada.parametros_atualizados";

export type EntidadeDeAuditoria = "jogador" | "lancamento" | "caixa_transacao" | "temporada";

export interface EventoDeAuditoria {
  id: number;
  jogadorId: number | null;
  nomeDoJogador: string | null;
  acao: AcaoDeAuditoria;
  entidadeTipo: EntidadeDeAuditoria;
  entidadeId: number;
  dadosAntes: Record<string, unknown> | null;
  dadosDepois: Record<string, unknown> | null;
  criadoEm: string;
}

/**
 * Grava um evento — chamada ao final de cada mutação sensível, dentro da
 * mesma transação quando já existir uma (`client`), pra nunca gravar um
 * evento de algo que acabou não acontecendo (rollback). `jogadorId` nulo
 * = ação de script/sistema (import histórico, seed), não de alguém
 * logado — nunca lança: uma falha ao registrar o evento não pode derrubar
 * a ação de verdade que está sendo auditada.
 */
export async function registrarEvento(
  client: PoolClient | null,
  evento: {
    jogadorId: number | null;
    acao: AcaoDeAuditoria;
    entidadeTipo: EntidadeDeAuditoria;
    entidadeId: number;
    dadosAntes?: Record<string, unknown> | null;
    dadosDepois?: Record<string, unknown> | null;
  },
): Promise<void> {
  try {
    const executor = client ?? db;
    await executor.query(
      `INSERT INTO eventos_de_auditoria
         (jogador_id, acao, entidade_tipo, entidade_id, dados_antes, dados_depois)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        evento.jogadorId,
        evento.acao,
        evento.entidadeTipo,
        evento.entidadeId,
        evento.dadosAntes ? JSON.stringify(evento.dadosAntes) : null,
        evento.dadosDepois ? JSON.stringify(evento.dadosDepois) : null,
      ],
    );
  } catch (error) {
    console.error("Falha ao registrar evento de auditoria", evento.acao, error);
  }
}

interface LinhaEvento {
  id: number;
  jogador_id: number | null;
  nome_do_jogador: string | null;
  acao: AcaoDeAuditoria;
  entidade_tipo: EntidadeDeAuditoria;
  entidade_id: number;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  criado_em: string;
}

function linhaParaEvento(linha: LinhaEvento): EventoDeAuditoria {
  return {
    id: linha.id,
    jogadorId: linha.jogador_id,
    nomeDoJogador: linha.nome_do_jogador,
    acao: linha.acao,
    entidadeTipo: linha.entidade_tipo,
    entidadeId: linha.entidade_id,
    dadosAntes: linha.dados_antes,
    dadosDepois: linha.dados_depois,
    criadoEm: new Date(linha.criado_em).toISOString(),
  };
}

/** Eventos mais recentes primeiro — usado pela tela de Atividade (Organizador). */
export async function listarEventosDeAuditoria(
  filtro: { entidadeTipo?: EntidadeDeAuditoria; entidadeId?: number; limite?: number } = {},
): Promise<EventoDeAuditoria[]> {
  const condicoes: string[] = [];
  const parametros: unknown[] = [];

  if (filtro.entidadeTipo) {
    parametros.push(filtro.entidadeTipo);
    condicoes.push(`e.entidade_tipo = $${parametros.length}`);
  }
  if (filtro.entidadeId !== undefined) {
    parametros.push(filtro.entidadeId);
    condicoes.push(`e.entidade_id = $${parametros.length}`);
  }
  const onde = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  parametros.push(filtro.limite ?? 100);

  const { rows } = await db.query<LinhaEvento>(
    `SELECT e.id, e.jogador_id, j.nome AS nome_do_jogador, e.acao, e.entidade_tipo,
            e.entidade_id, e.dados_antes, e.dados_depois, e.criado_em
     FROM eventos_de_auditoria e
     LEFT JOIN jogadores j ON j.id = e.jogador_id
     ${onde}
     ORDER BY e.criado_em DESC, e.id DESC
     LIMIT $${parametros.length}`,
    parametros,
  );

  return rows.map(linhaParaEvento);
}
