import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { autenticarOrganizador, trocarSenha } from "@/lib/auth/organizador";
import { hashSenha } from "@/lib/auth/senha";

const TELEFONE_DE_TESTE = "11900001111";
let jogadorId: number;

beforeAll(async () => {
  const senhaHash = await hashSenha("1111");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO jogadores (nome, telefone, senha_hash, eh_organizador)
     VALUES ('Organizador de Teste', $1, $2, true)
     ON CONFLICT (telefone) DO UPDATE SET senha_hash = EXCLUDED.senha_hash
     RETURNING id`,
    [TELEFONE_DE_TESTE, senhaHash],
  );
  jogadorId = rows[0].id;
});

afterAll(async () => {
  await db.query("DELETE FROM jogadores WHERE id = $1", [jogadorId]);
  await db.end();
});

describe("autenticarOrganizador (contra Postgres real)", () => {
  it("autentica com telefone e senha corretos", async () => {
    const organizador = await autenticarOrganizador(TELEFONE_DE_TESTE, "1111");

    expect(organizador).toEqual({
      id: jogadorId,
      nome: "Organizador de Teste",
      telefone: TELEFONE_DE_TESTE,
    });
  });

  it("rejeita senha errada", async () => {
    const organizador = await autenticarOrganizador(
      TELEFONE_DE_TESTE,
      "senha-errada",
    );

    expect(organizador).toBeNull();
  });

  it("rejeita telefone que não existe", async () => {
    const organizador = await autenticarOrganizador("00000000000", "1111");

    expect(organizador).toBeNull();
  });
});

describe("trocarSenha (contra Postgres real)", () => {
  it("troca a senha quando a senha atual está correta, e a nova passa a valer", async () => {
    const trocou = await trocarSenha(jogadorId, "1111", "nova-senha");
    expect(trocou).toBe(true);

    const comSenhaAntiga = await autenticarOrganizador(
      TELEFONE_DE_TESTE,
      "1111",
    );
    expect(comSenhaAntiga).toBeNull();

    const comSenhaNova = await autenticarOrganizador(
      TELEFONE_DE_TESTE,
      "nova-senha",
    );
    expect(comSenhaNova).not.toBeNull();
  });

  it("não troca a senha se a senha atual estiver errada", async () => {
    const trocou = await trocarSenha(jogadorId, "senha-atual-errada", "outra");
    expect(trocou).toBe(false);
  });
});
