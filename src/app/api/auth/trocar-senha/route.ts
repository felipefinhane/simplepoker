import { NextResponse } from "next/server";
import {
  NaoAutenticadoError,
  requireOrganizador,
  trocarSenha,
} from "@/lib/auth/organizador";

export async function POST(request: Request) {
  let organizador;
  try {
    organizador = await requireOrganizador();
  } catch (error) {
    if (error instanceof NaoAutenticadoError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const body = await request.json().catch(() => null);
  const senhaAtual =
    typeof body?.senhaAtual === "string" ? body.senhaAtual : null;
  const novaSenha =
    typeof body?.novaSenha === "string" ? body.novaSenha : null;

  if (!senhaAtual || !novaSenha) {
    return NextResponse.json(
      { error: "Informe a senha atual e a nova senha." },
      { status: 400 },
    );
  }

  if (novaSenha.length < 4) {
    return NextResponse.json(
      { error: "A nova senha precisa ter pelo menos 4 caracteres." },
      { status: 400 },
    );
  }

  const trocou = await trocarSenha(organizador.id, senhaAtual, novaSenha);
  if (!trocou) {
    return NextResponse.json(
      { error: "Senha atual incorreta." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
