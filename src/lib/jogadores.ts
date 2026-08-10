import { db, withTransaction } from "@/lib/db";
import { hashSenha, senhaInicialParaTelefone } from "@/lib/auth/senha";
import { normalizarTelefone } from "@/lib/auth/telefone";
import { registrarEvento } from "@/lib/auditoria";

/**
 * Um Jogador tal como listado/editado pelo Organizador. `telefone` só é
 * usado (e exigido) por quem é Organizador — ver `definirOrganizadorDoJogador`.
 * Exposto só em telas/rotas já protegidas por login (ver CONTEXT.md).
 */
export interface Jogador {
  id: number;
  nome: string;
  ativo: boolean;
  ehOrganizador: boolean;
  telefone: string | null;
}

interface LinhaJogador {
  id: number;
  nome: string;
  ativo: boolean;
  eh_organizador: boolean;
  telefone: string | null;
}

const COLUNAS_DO_JOGADOR = "id, nome, ativo, eh_organizador, telefone";

function linhaParaJogador(linha: LinhaJogador): Jogador {
  return {
    id: linha.id,
    nome: linha.nome,
    ativo: linha.ativo,
    ehOrganizador: linha.eh_organizador,
    telefone: linha.telefone,
  };
}

/**
 * Um Organizador não pode ser desativado por aqui — a semântica de
 * "desativar" para quem tem login ainda não foi definida no domínio (ver
 * ticket 04), então recusamos em vez de deixar um `ativo = false` que não
 * teria efeito nenhum no login.
 */
export class OrganizadorNaoPodeSerDesativadoError extends Error {
  constructor() {
    super("Um Organizador não pode ser desativado por aqui.");
    this.name = "OrganizadorNaoPodeSerDesativadoError";
  }
}

/** Promover a Organizador exige telefone — é como esse Jogador vai logar. */
export class TelefoneObrigatorioParaOrganizadorError extends Error {
  constructor() {
    super("Informe o telefone para tornar este Jogador Organizador.");
    this.name = "TelefoneObrigatorioParaOrganizadorError";
  }
}

/** Telefone já usado por outro Jogador (`telefone` é único — ver migration). */
export class TelefoneJaCadastradoError extends Error {
  constructor() {
    super("Esse telefone já está cadastrado para outro Jogador.");
    this.name = "TelefoneJaCadastradoError";
  }
}

/**
 * Sempre precisa sobrar pelo menos um Organizador — sem isso, ninguém mais
 * consegue entrar no app pra reverter (ticket 43).
 */
export class UltimoOrganizadorNaoPodeSerRemovidoError extends Error {
  constructor() {
    super("Não é possível remover o último Organizador restante.");
    this.name = "UltimoOrganizadorNaoPodeSerRemovidoError";
  }
}

/**
 * Cria um novo Jogador com apenas o nome (sem login — ver Organizador).
 * `atorId` é o Organizador logado que está cadastrando (null = script/
 * seed, sem ninguém logado) — ver ticket 44.
 */
export async function criarJogador(nome: string, atorId: number | null): Promise<Jogador> {
  const { rows } = await db.query<LinhaJogador>(
    `INSERT INTO jogadores (nome, criado_por_jogador_id)
     VALUES ($1, $2)
     RETURNING ${COLUNAS_DO_JOGADOR}`,
    [nome, atorId],
  );

  return linhaParaJogador(rows[0]);
}

/**
 * Todos os Jogadores (ativos e desativados), para a tela de gestão —
 * ativos primeiro, depois inativos; alfabético dentro de cada grupo (ver
 * ticket 45). `ativo DESC` porque `true` vem antes de `false` nessa ordem.
 */
export async function listarJogadores(): Promise<Jogador[]> {
  const { rows } = await db.query<LinhaJogador>(
    `SELECT ${COLUNAS_DO_JOGADOR} FROM jogadores ORDER BY ativo DESC, nome`,
  );

  return rows.map(linhaParaJogador);
}

/** Jogadores ativos — a lista usada ao lançar uma nova Partida (ticket 06). */
export async function listarJogadoresAtivos(): Promise<Jogador[]> {
  const { rows } = await db.query<LinhaJogador>(
    `SELECT ${COLUNAS_DO_JOGADOR} FROM jogadores WHERE ativo = true ORDER BY nome`,
  );

  return rows.map(linhaParaJogador);
}

/** Edita o nome de um Jogador existente. Retorna null se o id não existir. */
export async function editarNomeDoJogador(
  id: number,
  nome: string,
  atorId: number | null,
): Promise<Jogador | null> {
  const { rows } = await db.query<LinhaJogador>(
    `UPDATE jogadores
     SET nome = $2, atualizado_por_jogador_id = $3, atualizado_em = now()
     WHERE id = $1
     RETURNING ${COLUNAS_DO_JOGADOR}`,
    [id, nome, atorId],
  );

  return rows[0] ? linhaParaJogador(rows[0]) : null;
}

/**
 * Ativa/desativa um Jogador. Desativar não apaga nada — o Jogador some das
 * listas de participantes de novas Partidas, mas seu histórico continua
 * intacto (ver CONTEXT.md / ticket 04). Lança
 * `OrganizadorNaoPodeSerDesativadoError` se o alvo for um Organizador e
 * `ativo` for `false`.
 */
export async function definirAtivoDoJogador(
  id: number,
  ativo: boolean,
  atorId: number | null,
): Promise<Jogador | null> {
  if (!ativo) {
    const { rows } = await db.query<{ eh_organizador: boolean }>(
      `SELECT eh_organizador FROM jogadores WHERE id = $1`,
      [id],
    );
    if (rows[0]?.eh_organizador) {
      throw new OrganizadorNaoPodeSerDesativadoError();
    }
  }

  const { rows } = await db.query<LinhaJogador>(
    `UPDATE jogadores
     SET ativo = $2, atualizado_por_jogador_id = $3, atualizado_em = now()
     WHERE id = $1
     RETURNING ${COLUNAS_DO_JOGADOR}`,
    [id, ativo, atorId],
  );

  return rows[0] ? linhaParaJogador(rows[0]) : null;
}

/**
 * Promove/rebaixa um Jogador a Organizador.
 *
 * Promover exige telefone (o que o Jogador já tiver, ou o passado aqui) —
 * vira a senha inicial os 4 últimos dígitos dele
 * (`senhaInicialParaTelefone`), o mesmo padrão manual que
 * `seed-organizador.ts` já usava. Lança `TelefoneObrigatorioParaOrganizadorError`
 * sem telefone nenhum, ou `TelefoneJaCadastradoError` se já for de outro
 * Jogador (`telefone` é único — ver migration).
 *
 * Rebaixar invalida a senha (`senha_hash = NULL`) em vez de só desmarcar
 * `eh_organizador` — sem isso, a senha antiga continuaria funcionando se
 * alguém promovesse esse Jogador de novo sem definir uma senha nova.
 * Trava (dentro de uma transação, `FOR UPDATE` na linha do Jogador —
 * evita a corrida mais comum, dois cliques na mesma pessoa; a corrida bem
 * mais rara de duas pessoas *diferentes* sendo rebaixadas ao mesmo tempo
 * não é travada aqui, custo/benefício não compensa a mais para um app
 * usado por um grupo pequeno): nunca deixa remover o último Organizador
 * restante.
 */
export async function definirOrganizadorDoJogador(
  id: number,
  ehOrganizador: boolean,
  atorId: number | null,
  telefone?: string,
): Promise<Jogador | null> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ telefone: string | null; eh_organizador: boolean }>(
      `SELECT telefone, eh_organizador FROM jogadores WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const linha = rows[0];
    if (!linha) return null;

    if (ehOrganizador) {
      const telefoneFinal = normalizarTelefone(telefone ?? linha.telefone ?? "");
      if (!telefoneFinal) throw new TelefoneObrigatorioParaOrganizadorError();

      const senhaHash = await hashSenha(senhaInicialParaTelefone(telefoneFinal));

      try {
        const { rows: atualizado } = await client.query<LinhaJogador>(
          `UPDATE jogadores
           SET eh_organizador = true, telefone = $2, senha_hash = $3,
               atualizado_por_jogador_id = $4, atualizado_em = now()
           WHERE id = $1
           RETURNING ${COLUNAS_DO_JOGADOR}`,
          [id, telefoneFinal, senhaHash, atorId],
        );
        // Ação sensível — vira Organizador é acesso de verdade ao app.
        // Ver ticket 44.
        await registrarEvento(client, {
          jogadorId: atorId,
          acao: "jogador.promovido",
          entidadeTipo: "jogador",
          entidadeId: id,
          dadosDepois: { ehOrganizador: true, telefone: telefoneFinal },
        });
        return linhaParaJogador(atualizado[0]);
      } catch (error) {
        if ((error as { code?: string }).code === "23505") {
          throw new TelefoneJaCadastradoError();
        }
        throw error;
      }
    }

    if (linha.eh_organizador) {
      const { rows: contagem } = await client.query<{ total: string }>(
        `SELECT count(*) AS total FROM jogadores WHERE eh_organizador = true`,
      );
      if (Number(contagem[0].total) <= 1) {
        throw new UltimoOrganizadorNaoPodeSerRemovidoError();
      }
    }

    const { rows: atualizado } = await client.query<LinhaJogador>(
      `UPDATE jogadores
       SET eh_organizador = false, senha_hash = NULL,
           atualizado_por_jogador_id = $2, atualizado_em = now()
       WHERE id = $1
       RETURNING ${COLUNAS_DO_JOGADOR}`,
      [id, atorId],
    );
    await registrarEvento(client, {
      jogadorId: atorId,
      acao: "jogador.rebaixado",
      entidadeTipo: "jogador",
      entidadeId: id,
      dadosAntes: { ehOrganizador: true },
    });
    return linhaParaJogador(atualizado[0]);
  });
}
