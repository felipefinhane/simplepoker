import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  OrganizadorNaoPodeSerDesativadoError,
  TelefoneJaCadastradoError,
  TelefoneObrigatorioParaOrganizadorError,
  criarJogador,
  definirAtivoDoJogador,
  definirOrganizadorDoJogador,
  editarNomeDoJogador,
  listarJogadores,
  listarJogadoresAtivos,
} from "@/lib/jogadores";
import { verificarSenha } from "@/lib/auth/senha";

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
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);

    expect(jogador).toMatchObject({
      nome: NOMES_DE_TESTE[0],
      ativo: true,
      ehOrganizador: false,
    });
  });

  it("lista os Jogadores cadastrados em ordem alfabética", async () => {
    await criarJogador(NOMES_DE_TESTE[0], null); // "Zeca..."
    await criarJogador(NOMES_DE_TESTE[1], null); // "Ana..."

    const jogadores = await listarJogadores();
    const nomes = jogadores.map((j) => j.nome).filter((n) => n.endsWith("de Teste"));

    expect(nomes).toEqual(["Ana de Teste", "Zeca de Teste"]);
  });
});

describe("editarNomeDoJogador (contra Postgres real)", () => {
  it("atualiza o nome de um Jogador existente", async () => {
    const criado = await criarJogador(NOMES_DE_TESTE[0], null);

    const editado = await editarNomeDoJogador(criado.id, "Zeca Editado de Teste", null);

    expect(editado?.nome).toBe("Zeca Editado de Teste");
  });

  it("retorna null para um id que não existe", async () => {
    const editado = await editarNomeDoJogador(999999999, "Ninguém", null);
    expect(editado).toBeNull();
  });
});

describe("definirAtivoDoJogador / listarJogadoresAtivos (contra Postgres real)", () => {
  it("desativar remove o Jogador de listarJogadoresAtivos, mas ele continua em listarJogadores", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);

    await definirAtivoDoJogador(jogador.id, false, null);

    const ativos = await listarJogadoresAtivos();
    const todos = await listarJogadores();

    expect(ativos.some((j) => j.id === jogador.id)).toBe(false);
    expect(todos.some((j) => j.id === jogador.id)).toBe(true);
  });

  it("reativar volta a incluir o Jogador em listarJogadoresAtivos", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);
    await definirAtivoDoJogador(jogador.id, false, null);

    await definirAtivoDoJogador(jogador.id, true, null);

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

    await expect(definirAtivoDoJogador(organizadorId, false, null)).rejects.toThrow(
      OrganizadorNaoPodeSerDesativadoError,
    );

    await db.query("DELETE FROM jogadores WHERE id = $1", [organizadorId]);
  });
});

// A trava "não deixa remover o último Organizador restante" não é testada
// aqui de propósito: exigiria mexer nos Organizadores reais já
// seedados (ex: "Organizador Teste") pra derrubar a contagem global até
// 1, arriscado demais num banco compartilhado com o resto do dev local —
// verificada manualmente contra a API de verdade (ver ticket 43).
describe("definirOrganizadorDoJogador (contra Postgres real)", () => {
  it("recusa promover sem telefone (nem no Jogador, nem passado na chamada)", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);

    await expect(definirOrganizadorDoJogador(jogador.id, true, null)).rejects.toThrow(
      TelefoneObrigatorioParaOrganizadorError,
    );
  });

  it("promove com telefone passado na chamada — grava telefone e uma senha igual aos 4 últimos dígitos", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);

    const promovido = await definirOrganizadorDoJogador(jogador.id, true, null, "11900003333");

    expect(promovido).toMatchObject({ ehOrganizador: true, telefone: "11900003333" });
    const { rows } = await db.query<{ senha_hash: string }>(
      `SELECT senha_hash FROM jogadores WHERE id = $1`,
      [jogador.id],
    );
    await expect(verificarSenha("3333", rows[0].senha_hash)).resolves.toBe(true);
  });

  it("promove usando o telefone que o Jogador já tinha, sem precisar passar de novo", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);
    await db.query(`UPDATE jogadores SET telefone = '11900004444' WHERE id = $1`, [jogador.id]);

    const promovido = await definirOrganizadorDoJogador(jogador.id, true, null);

    expect(promovido?.telefone).toBe("11900004444");
  });

  it("recusa promover com um telefone que já é de outro Jogador", async () => {
    const jogadorA = await criarJogador(NOMES_DE_TESTE[0], null);
    await definirOrganizadorDoJogador(jogadorA.id, true, null, "11900005555");
    const jogadorB = await criarJogador(NOMES_DE_TESTE[1], null);

    await expect(
      definirOrganizadorDoJogador(jogadorB.id, true, null, "11900005555"),
    ).rejects.toThrow(TelefoneJaCadastradoError);
  });

  it("rebaixar invalida a senha — login antigo deixa de funcionar", async () => {
    const jogador = await criarJogador(NOMES_DE_TESTE[0], null);
    await definirOrganizadorDoJogador(jogador.id, true, null, "11900006666");

    const rebaixado = await definirOrganizadorDoJogador(jogador.id, false, null);

    expect(rebaixado?.ehOrganizador).toBe(false);
    const { rows } = await db.query<{ senha_hash: string | null }>(
      `SELECT senha_hash FROM jogadores WHERE id = $1`,
      [jogador.id],
    );
    expect(rows[0].senha_hash).toBeNull();
  });
});
