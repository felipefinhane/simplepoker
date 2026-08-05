import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export interface DadosDaSessao {
  jogadorId?: number;
}

const senhaDaSessao = process.env.SESSION_SECRET;

if (!senhaDaSessao || senhaDaSessao.length < 32) {
  throw new Error(
    "SESSION_SECRET precisa estar definida com pelo menos 32 caracteres.",
  );
}

const opcoesDaSessao = {
  password: senhaDaSessao,
  cookieName: "simplepoker_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    // Explícitos mesmo já sendo o default do iron-session — cookie de
    // sessão não deve ficar implícito.
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

/** Sessão do Organizador logado, guardada num cookie assinado. */
export async function getSession(): Promise<IronSession<DadosDaSessao>> {
  return getIronSession<DadosDaSessao>(await cookies(), opcoesDaSessao);
}
