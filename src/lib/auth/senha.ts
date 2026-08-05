import bcrypt from "bcryptjs";
import { normalizarTelefone } from "./telefone";

const CUSTO_DO_HASH = 12;

/**
 * Senha inicial do Organizador: os 4 últimos dígitos do telefone. Ver
 * CONTEXT.md / spec — trocada pelo próprio Organizador depois do primeiro
 * login.
 */
export function senhaInicialParaTelefone(telefone: string): string {
  return normalizarTelefone(telefone).slice(-4);
}

/** Hash da senha para armazenar — nunca guardamos a senha em texto puro. */
export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO_DO_HASH);
}

/** Confere uma senha em texto puro contra o hash armazenado. */
export function verificarSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
