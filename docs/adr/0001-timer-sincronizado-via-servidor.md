# Timer de blinds sincronizado via servidor, não local por aparelho

O timer de blinds precisa ser visto igualmente por todos os jogadores de uma Partida. A alternativa mais simples — cada aparelho rodar seu próprio timer local, sem coordenação — foi descartada porque o pedido explícito é que o estado (nível de blind atual, tempo restante) seja compartilhado: um Organizador controla start/pause/pular nível, e todos os outros dispositivos abertos naquele momento devem refletir o mesmo relógio e ser alertados quando o blind muda.

Isso implica manter o estado do timer no backend (não só no cliente) e os demais clientes consultarem/receberem esse estado (polling ou WebSocket). Notificação push com o app fechado fica fora do v1 (ver escopo do timer): o alerta em v1 só aparece para quem está com o app aberto em primeiro plano.
