"use client";

import { useState, type FormEvent } from "react";

export default function TrocarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(corpo?.error ?? "Não foi possível trocar a senha.");
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setMensagem("Senha alterada.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <h1>Trocar senha</h1>
        <label>
          Senha atual
          <input
            type="password"
            required
            value={senhaAtual}
            onChange={(event) => setSenhaAtual(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          Nova senha
          <input
            type="password"
            required
            minLength={4}
            value={novaSenha}
            onChange={(event) => setNovaSenha(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        {erro && <p style={{ color: "crimson" }}>{erro}</p>}
        {mensagem && <p style={{ color: "green" }}>{mensagem}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </main>
  );
}
