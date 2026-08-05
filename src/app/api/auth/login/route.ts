import { NextResponse } from "next/server";
import { autenticarOrganizador } from "@/lib/auth/organizador";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const telefone = typeof body?.telefone === "string" ? body.telefone : null;
  const senha = typeof body?.senha === "string" ? body.senha : null;

  if (!telefone || !senha) {
    return NextResponse.json(
      { error: "Informe telefone e senha." },
      { status: 400 },
    );
  }

  const organizador = await autenticarOrganizador(telefone, senha);
  if (!organizador) {
    return NextResponse.json(
      { error: "Telefone ou senha inválidos." },
      { status: 401 },
    );
  }

  const session = await getSession();
  session.jogadorId = organizador.id;
  await session.save();

  return NextResponse.json({
    organizador: { id: organizador.id, nome: organizador.nome },
  });
}
