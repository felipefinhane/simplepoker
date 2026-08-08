import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem isso, o dev server só hidrata o React (e conecta o HMR) quando
  // acessado como "localhost" — abrir pelo IP da rede local (celular
  // testando via Wi-Fi, ex: http://192.168.x.x:3000) carrega o HTML certo,
  // mas o app nunca fica interativo (Timer, botões, nada): o navegador
  // conta como "cross-origin" pro dev server e o React nem chega a rodar
  // (ver node_modules/next/dist/docs/.../allowedDevOrigins.md). Ignorado
  // em produção — só existe em `next dev`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
