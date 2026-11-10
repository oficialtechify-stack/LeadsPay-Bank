/**
 * Roteamento do app logado — duas camadas (§4 do plano v2):
 * - pílulas do topo: Conta / Vendas / Meu Negócio / Moedas (TOP_TABS);
 * - bottom nav: Início / Extrato / Vender / Cartão / Ajustes (bottomActive).
 *
 * Regra pílula × aba-pai (§4): a pílula ativa é NULA em rota interna (só o
 * bottom nav marca o contexto). "Aba-pai" = SOMENTE o destino do botão
 * Voltar — não uma pílula acesa.
 *
 * Desvios declarados da referência (QA), decisões próprias do plano v2:
 * - `negocio` → bottom "Vender" (na QA caía no default `inicio`);
 * - `ajustes` → bottom "Ajustes" (na QA não existe esse item);
 * - `gestao` pai = Meu Negócio (na QA era Vendas);
 * - `extrato` pai = Vendas (na QA era Conta);
 * - rota `api` nova (não existe na QA).
 * Q-nav1 = (B): o tile central "Vender" é ROTA para a aba Vendas; o Tap
 * abre de dentro da Vendas, não do centro.
 */

export type Route =
  | { name: 'conta' }
  | { name: 'vendas' }
  | { name: 'negocio' }
  | { name: 'moedas' }
  | { name: 'extrato' }
  | { name: 'cartao' }
  | { name: 'gestao' }
  | { name: 'api' }
  | { name: 'ajustes' }
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
 * Pílula ativa do topo — NULA em rota interna (§4, regra pílula × aba-pai).
 * Numa rota interna só o bottom nav marca o contexto.
 */
export function activeTopTab(route: Route): TopTabName | null {
  return isTopTab(route) ? route.name : null;
}

/** Qual item do bottom nav aparece ativo para cada rota. */
export function bottomActive(
  route: Route
): 'inicio' | 'extrato' | 'cartao' | 'vender' | 'ajustes' {
  if (route.name === 'soon') return bottomActive(route.backTo);
  switch (route.name) {
    case 'vendas':
    case 'tap':
    case 'negocio':
    case 'gestao':
    case 'api':
      return 'vender';
    case 'extrato':
      return 'extrato';
    case 'cartao':
      return 'cartao';
    case 'ajustes':
      return 'ajustes';
    default:
      return 'inicio';
  }
}

/**
 * Rota-pai de cada tela interna — SOMENTE o destino do botão Voltar.
 * Desvios próprios: gestao/api → Meu Negócio, extrato → Vendas.
 */
export function parentRoute(route: Route): Route {
  switch (route.name) {
    case 'pix':
    case 'ajustes':
    case 'cartao':
      return { name: 'conta' };
    case 'tap':
    case 'extrato':
      return { name: 'vendas' };
    case 'gestao':
    case 'api':
      return { name: 'negocio' };
    case 'soon':
      return route.backTo;
    default:
      return { name: 'conta' };
  }
}
