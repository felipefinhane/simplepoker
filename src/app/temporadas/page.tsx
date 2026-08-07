import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import {
  buscarTemporadaAberta,
  obterParametrosPadraoParaNovaTemporada,
  serializarParametros,
} from "@/lib/temporadas";
import { listarPartidasDaTemporada } from "@/lib/partidas";
import { calcularRankingsDaTemporada } from "@/lib/rankings";
import { TemporadaClient } from "./temporada-client";

export default async function TemporadasPage() {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const temporadaAberta = await buscarTemporadaAberta();
  const parametrosIniciais = serializarParametros(
    temporadaAberta
      ? temporadaAberta.parametros
      : await obterParametrosPadraoParaNovaTemporada(),
  );

  // Dados só pra exibir no resumo do modal de "Encerrar Temporada" — nunca
  // bloqueiam a página se algo aqui falhar em algum caso de borda raro.
  const [partidas, rankings] = temporadaAberta
    ? await Promise.all([
        listarPartidasDaTemporada(temporadaAberta.id),
        calcularRankingsDaTemporada(temporadaAberta.id),
      ])
    : [[], null];
  const lider = rankings?.rankingDePontuacao[0]?.nome ?? null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Parâmetros da Temporada</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Ajuste as regras globais para todas as Partidas desta Temporada.
        </p>
      </div>

      {temporadaAberta ? (
        <TemporadaClient
          modo="editar"
          temporadaId={temporadaAberta.id}
          parametrosIniciais={parametrosIniciais}
          resumoParaEncerrar={{
            totalDePartidas: partidas.length,
            lider,
          }}
        />
      ) : (
        <TemporadaClient modo="criar" parametrosIniciais={parametrosIniciais} />
      )}
    </main>
  );
}
