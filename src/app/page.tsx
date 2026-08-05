export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: "0.5rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1>Simplepoker</h1>
      <p>
        Ranking, resultados e caixa do campeonato de poker semanal do grupo.
      </p>
      <p style={{ opacity: 0.6 }}>Em construção 🃏</p>
    </main>
  );
}
