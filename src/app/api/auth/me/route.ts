import { NextResponse } from "next/server";
import { requireOrganizadorOuResposta } from "@/lib/auth/organizador";

/**
 * Prova de que o guard de autenticação funciona ponta-a-ponta — as rotas
 * restritas seguem o mesmo padrão.
 */
export async function GET() {
  const organizadorOuResposta = await requireOrganizadorOuResposta();
  if (organizadorOuResposta instanceof NextResponse) return organizadorOuResposta;

  return NextResponse.json({ organizador: organizadorOuResposta });
}
