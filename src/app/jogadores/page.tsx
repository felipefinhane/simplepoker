import { redirect } from "next/navigation";
import { getOrganizadorLogado } from "@/lib/auth/organizador";
import { listarJogadores } from "@/lib/jogadores";
import { JogadoresClient } from "./jogadores-client";

export default async function JogadoresPage() {
  const organizador = await getOrganizadorLogado();
  if (!organizador) {
    redirect("/login");
  }

  const jogadores = await listarJogadores();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-section-margin px-container-padding py-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Jogadores</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Gerencie a lista de participantes do clube.
        </p>
      </div>
      <JogadoresClient jogadoresIniciais={jogadores} />
    </main>
  );
}
