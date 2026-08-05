"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, senha }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.error ?? "Não foi possível entrar.");
        return;
      }

      router.push("/");
      router.refresh();
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
        <h1>Entrar</h1>
        <label>
          Celular
          <input
            type="tel"
            required
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {erro && <p style={{ color: "crimson" }}>{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
