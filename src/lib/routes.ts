/**
 * Roteamento do app logado — v3.2 (painel web novo).
 * Camadas (§D4 do delta v3.2):
 * - pílulas do topo (mobile): Conta / Vendas / Meu Negócio / Moedas;
 * - bottom nav (mobile, 5 itens): Início / Extrato / Vender / Cartão / Ajustes;
 * - sidebar (desktop, §D4.1): 20 links de página + 2 abridores + rodapé.
 *
 * Regras (§D1):
 * - `negocio` é rota VIRTUAL (pai): navegar para ela renderiza `gestao`.
 * - `pix` e `tap` são modais, não páginas (comportamento atual preservado).
 * - `assistente` substitui `jim` (renome v3.2 §D3); `security` NÃO é rota
 *   (abre o SecurityCenterModal existente via estado).
 * - `soon` NÃO é página: redireciona para `conta` com a pílula de origem.
 */

export type Route =
  | { name: 'conta' }
  | { name: 'vendas' }
  | { name: 'negocio' }
  | { name: 'moedas' }
  | { name: 'extrato' }
  | { name: 'cartao' }
  | { name: 'emprestimo' }
  | { name: 'gestao' }
  | { name: 'api' }
  | { name: 'links-pagamento' }
  | { name: 'loja' }
  | { name: 'planos' }
  | { name: 'agendamentos' }
  | { name: 'checkout' }
  | { name: 'catalogo' }
  | { name: 'cardapio' }
  | { name: 'recebimentos' }
  | { name: 'clientes' }
  | { name: 'das-mei' }
  | { name: 'chargeback' }
  | { name: 'indique' }
  | { name: 'academy' }
  | { name: 'ajustes' }
  | { name: 'nova-cobranca' }
  | { name: 'assistente' }
  | { name: 'pix' }
  | { name: 'tap' }
  | { name: 'soon'; title: string; reason: string; backTo: Route };

export type TopTabName = 'conta' | 'vendas' | 'negocio' | 'moedas';

export const TOP_TABS: { id: TopTabName; label: string }[] = [
  { id: 'conta', label: 'Conta' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'negocio', label: 'Meu Negócio' },
  { id: 'moedas', label: 'Moedas' },
];

export function isTopTab(route: Route): route is { name: TopTabName } {
  return (
    route.name === 'conta' ||
    route.name === 'vendas' ||
    route.name === 'negocio' ||
    route.name === 'moedas'
  );
}

/**
 * Pílula ativa do topo — NULA em rota interna (§4 v2, mantido).
 * Numa rota interna só o bottom nav (mobile) ou o sidebar (desktop)
 * marcam o contexto.
 */
export function activeTopTab(route: Route): TopTabName | null {
  return isTopTab(route) ? route.name : null;
}

/**
 * Qual item do bottom nav aparece ativo para cada rota (§D1.2, corrigido:
 * a união é a do BottomNavBar real — 5 itens. `moedas` e `pix` caem no
 * default `inicio`: Moedas não tem item no bottom nav).
 */
export function bottomActive(
  route: Route
): 'inicio' | 'extrato' | 'cartao' | 'vender' | 'ajustes' {
  if (route.name === 'soon') return bottomActive(route.backTo);
  switch (route.name) {
    case 'extrato':
      return 'extrato';
    case 'cartao':
      return 'cartao';
    case 'ajustes':
      return 'ajustes';
    case 'vendas':
    case 'tap':
    case 'negocio':
    case 'gestao':
    case 'api':
    case 'nova-cobranca':
    case 'links-pagamento':
    case 'loja':
    case 'planos':
    case 'agendamentos':
    case 'checkout':
    case 'catalogo':
    case 'cardapio':
    case 'recebimentos':
    case 'clientes':
    case 'das-mei':
    case 'chargeback':
    case 'indique':
    case 'academy':
      return 'vender';
    default:
      // conta, moedas, assistente, pix
      return 'inicio';
  }
}

/**
 * Rota-pai de cada tela interna — SOMENTE o destino do botão Voltar (§D1.3).
 * Assinatura mantida como `Route` (nunca null): hoje nenhum componente a
 * chama; os botões Voltar navegam por rota explícita.
 */
export function parentRoute(route: Route): Route {
  if (route.name === 'soon') return route.backTo;
  switch (route.name) {
    case 'pix':
    case 'ajustes':
    case 'cartao':
    case 'emprestimo':
      return { name: 'conta' };
    case 'tap':
    case 'extrato':
      return { name: 'vendas' };
    case 'gestao':
    case 'api':
      return { name: 'negocio' };
    case 'nova-cobranca':
      return { name: 'gestao' };
    case 'assistente':
      return { name: 'conta' };
    case 'links-pagamento':
    case 'loja':
    case 'planos':
    case 'agendamentos':
    case 'checkout':
    case 'catalogo':
    case 'cardapio':
    case 'recebimentos':
    case 'clientes':
    case 'das-mei':
    case 'chargeback':
    case 'indique':
    case 'academy':
      return { name: 'conta' };
    default:
      return { name: 'conta' };
  }
}
