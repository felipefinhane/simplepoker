import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import {
  buscarTemporadaAberta,
  obterParametrosPadraoParaNovaTemporada,
  serializarParametros,
} from "@/lib/temporadas";
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

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "2rem" }}>
      <h1>Temporada</h1>
      {temporadaAberta ? (
        <TemporadaClient
          modo="editar"
          temporadaId={temporadaAberta.id}
          parametrosIniciais={parametrosIniciais}
        />
      ) : (
        <TemporadaClient modo="criar" parametrosIniciais={parametrosIniciais} />
      )}
    </main>
  );
}
