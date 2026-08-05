import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  OrganizadorNaoPodeSerDesativadoError,
  criarJogador,
  definirAtivoDoJogador,
  editarNomeDoJogador,
  listarJogadores,
  listarJogadoresAtivos,
} from "@/lib/jogadores";

const NOMES_DE_TESTE = ["Zeca de Teste", "Ana de Teste"];

beforeEach(async () => {
  await db.query("DELETE FROM jogadores WHERE nome LIKE '%de Teste'");
});

afterAll(async () => {
  await db.query("DELETE FROM jogadores WHERE nome LIKE '%de Teste'");
  await db.end();
});

describe("criarJogador / listarJogadores (contra Postgres real)", () => {
  it("cria um Jogador com apenas o nome, ativo por padrão, sem ser Organizador", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0]);

    expect(jogador).toMatchObject({
      nome: NOMES_DE_TESTE[0],
      ativo: true,
      ehOrganizador: false,
    });
  });

  it("lista os Jogadores cadastrados em ordem alfabética", async () => {
    await criarJogador(NOMES_DE_TESTE[0]); // "Zeca..."
    await criarJogador(NOMES_DE_TESTE[1]); // "Ana..."

    const jogadores = await listarJogadores();
    const nomes = jogadores.map((j) => j.nome).filter((n) => n.endsWith("de Teste"));

    expect(nomes).toEqual(["Ana de Teste", "Zeca de Teste"]);
  });
});

describe("editarNomeDoJogador (contra Postgres real)", () => {
  it("atualiza o nome de um Jogador existente", async () => {
    const criado = await criarJogador(NOMES_DE_TESTE[0]);

    const editado = await editarNomeDoJogador(criado.id, "Zeca Editado de Teste");

    expect(editado?.nome).toBe("Zeca Editado de Teste");
  });

  it("retorna null para um id que não existe", async () => {
    const editado = await editarNomeDoJogador(999999999, "Ninguém");
    expect(editado).toBeNull();
  });
});

describe("definirAtivoDoJogador / listarJogadoresAtivos (contra Postgres real)", () => {
  it("desativar remove o Jogador de listarJogadoresAtivos, mas ele continua em listarJogadores", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0]);

    await definirAtivoDoJogador(jogador.id, false);

    const ativos = await listarJogadoresAtivos();
    const todos = await listarJogadores();

    expect(ativos.some((j) => j.id === jogador.id)).toBe(false);
    expect(todos.some((j) => j.id === jogador.id)).toBe(true);
  });

  it("reativar volta a incluir o Jogador em listarJogadoresAtivos", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0]);
    await definirAtivoDoJogador(jogador.id, false);

    await definirAtivoDoJogador(jogador.id, true);

    const ativos = await listarJogadoresAtivos();
    expect(ativos.some((j) => j.id === jogador.id)).toBe(true);
  });

  it("recusa desativar um Organizador", async () => {
    const { rows } = await db.query<{ id: number }>(
      `INSERT INTO jogadores (nome, telefone, senha_hash, eh_organizador)
       VALUES ('Organizador de Teste', '11900002222', 'hash-fake', true)
       RETURNING id`,
    );
    const organizadorId = rows[0].id;

    await expect(definirAtivoDoJogador(organizadorId, false)).rejects.toThrow(
      OrganizadorNaoPodeSerDesativadoError,
    );

    await db.query("DELETE FROM jogadores WHERE id = $1", [organizadorId]);
  });
});
