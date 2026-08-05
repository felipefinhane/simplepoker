import { describe, expect, it } from "vitest";
import {
  senhaInicialParaTelefone,
  hashSenha,
  verificarSenha,
} from "./senha";

describe("senhaInicialParaTelefone", () => {
  it("é os 4 últimos dígitos do telefone", () => {
    expect(senhaInicialParaTelefone("11999998888")).toBe("8888");
  });

  it("ignora caracteres de formatação (espaços, parênteses, traço, +55)", () => {
    expect(senhaInicialParaTelefone("+55 (11) 99999-8888")).toBe("8888");
  });
});

describe("hashSenha / verificarSenha", () => {
  it("o hash não é a senha em texto puro", async () => {
    const hash = await hashSenha("8888");

    expect(hash).not.toBe("8888");
  });

  it("verificarSenha aceita a senha correta", async () => {
    const hash = await hashSenha("8888");

    await expect(verificarSenha("8888", hash)).resolves.toBe(true);
  });

  it("verificarSenha rejeita a senha errada", async () => {
    const hash = await hashSenha("8888");

    await expect(verificarSenha("0000", hash)).resolves.toBe(false);
  });
});
