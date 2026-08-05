import { describe, expect, it } from "vitest";
import { normalizarTelefone } from "./telefone";

describe("normalizarTelefone", () => {
  it("mantém um telefone que já é só dígitos", () => {
    expect(normalizarTelefone("11999998888")).toBe("11999998888");
  });

  it("remove espaços, parênteses, traço e o +55", () => {
    expect(normalizarTelefone("+55 (11) 99999-8888")).toBe("5511999998888");
  });
});
