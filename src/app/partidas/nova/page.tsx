import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { listarJogadoresAtivos } from "@/lib/jogadores";
import { NovaPartidaClient } from "./nova-partida-client";

export default async function NovaPartidaPage() {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const jogadoresAtivos = await listarJogadoresAtivos();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Nova Partida</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Escolha a data e os participantes da noite.
        </p>
      </div>
      <NovaPartidaClient jogadoresAtivos={jogadoresAtivos} />
    </main>
  );
}
