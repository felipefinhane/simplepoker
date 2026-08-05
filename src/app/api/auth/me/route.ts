import { NextResponse } from "next/server";
import { NaoAutenticadoError, requireOrganizador } from "@/lib/auth/organizador";

/**
 * Prova de que o guard de autenticação funciona ponta-a-ponta — as rotas
 * restritas dos próximos tickets seguem o mesmo padrão.
 */
export async function GET() {
  try {
    const organizador = await requireOrganizador();
    return NextResponse.json({ organizador });
  } catch (error) {
    if (error instanceof NaoAutenticadoError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
