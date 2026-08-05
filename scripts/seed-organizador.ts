/**
 * Cria (ou atualiza) o Organizador inicial — não existe cadastro de
 * Organizador pela UI nesta versão, então quem sobe o app pela primeira
 * vez roda isso uma vez para poder logar.
 *
 * Uso: ORGANIZADOR_NOME="Felipe" ORGANIZADOR_TELEFONE="11999998888" \
 *      npm run seed:organizador
 */
import { db } from "../src/lib/db";
import { hashSenha, senhaInicialParaTelefone } from "../src/lib/auth/senha";
import { normalizarTelefone } from "../src/lib/auth/telefone";

async function main() {
  const nome = process.env.ORGANIZADOR_NOME;
  const telefoneInformado = process.env.ORGANIZADOR_TELEFONE;

  if (!nome || !telefoneInformado) {
    console.error(
      "Defina ORGANIZADOR_NOME e ORGANIZADOR_TELEFONE antes de rodar.",
    );
    process.exitCode = 1;
    return;
  }

  // Guardado só com dígitos, pra bater com a normalização feita no login
  // independente de como o telefone foi formatado aqui.
  const telefone = normalizarTelefone(telefoneInformado);
  const senhaHash = await hashSenha(senhaInicialParaTelefone(telefone));

  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO jogadores (nome, telefone, senha_hash, eh_organizador)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (telefone) DO UPDATE SET nome = EXCLUDED.nome
     RETURNING id`,
    [nome, telefone, senhaHash],
  );

  console.log(
    `Organizador "${nome}" (id ${rows[0].id}) pronto. Senha inicial: os 4 últimos dígitos do telefone informado.`,
  );
}

main()
  .catch((error) => {
    console.error("Falha ao criar o Organizador:", error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
