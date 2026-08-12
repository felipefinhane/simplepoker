# 49 — Melhorar a cor do sino de notificações

**What to build:** O botão de notificação (`BotaoNotificacao`, `src/app/partidas/[id]/botao-notificacao.tsx`) usa `bg-secondary/20 text-secondary` pro estado "inscrito". Organizador achou pouco perceptível — quer mais contraste/destaque, pra ficar claro de relance quando a notificação está ativada.

**Blocked by:** Nenhum.

**Status:** done

- [x] Estado "inscrito" trocado pra `bg-primary text-on-primary` (preenchimento sólido, não mais translúcido) — mesma cor já usada pro estado "ligado" do toggle de Jogador ativo (`modal-gerenciar-jogadores.tsx`), em vez de `secondary` (dourado, usado em botões/valores por todo o app, difícil de ler como "isso está ativado" à primeira vista)
- [x] Conferido nos dois fundos (`sobreFundoEscuro` true/false) — `bg-primary`/`text-on-primary` mantém bom contraste tanto sobre o card verde escuro do Timer quanto sobre a superfície padrão
- [x] Outros estados do componente (erro, sem-suporte, dica do iOS) não foram tocados — continuam com o mesmo contraste de antes
- [x] Mesmo tratamento (`bg-primary`) reaproveitado nos dois toggles novos da tela de Configurações (ticket 54), pra manter o "isso está ligado" consistente em todo o app

## Comments

`npm test` (58/58), lint e `tsc --noEmit` limpos. Não deu pra tirar print do estado "inscrito" de verdade nesta rodada (headless não completa o fluxo real de permissão de push), mas a troca de classe é só CSS — sem lógica nova pra testar.
