import type { Route } from '../../lib/routes';
import type { Transaction, UserProfile, VirtualCard } from '../../types';

/**
 * Estado da UI do painel novo (v3.2 §D2). O Shell é o dono de todo o
 * estado da UI do painel; nenhuma view nova recebe estado de shell por
 * prop vindas do App.tsx, exceto dados (userProfile, transactions, cards,
 * syncState).
 */
export type ShellUi = {
  /** Drawer Área Pix (U23) aberto. */
  pixDrawerOpen: boolean;
  /** Modal Link na Bio (U24) aberto. */
  linkBioOpen: boolean;
  /** Widget Central de Ajuda (U25) aberto. */
  ajudaOpen: boolean;
  /** Rota de volta do Assistente (padrão: conta). */
  assistenteReturn: Route;
  /** Aba ativa de Suas vendas (U6). */
  salesTab: 'calendar' | 'table' | 'charts';
  /** Cliente filtrado em Suas vendas (U6, vindo de U17). */
  salesClientFilter: string | null;
};

/** Preferência de tema do shell (v3.2 §D7.1): 'light' | 'dark' | 'system'. */
export type ThemePref = 'light' | 'dark' | 'system';

/** Estado de sincronização do Firestore (v3.2 §D7.5). */
export type SyncStateShape = { loading: boolean; error: string | null };

/**
 * Contrato de props das 25 unidades do painel novo (U1–U25).
 * Views de página recebem exatamente isto; o Shell monta o objeto.
 */
export interface PainelProps {
  userProfile: UserProfile;
  transactions: Transaction[];
  cards: VirtualCard[];
  showBalance: boolean;
  onToggleBalance: () => void;
  /** Helper único de navegação: seta a rota e aplica `opts` no ShellUi. */
  navigate: (next: Route, opts?: Partial<ShellUi>) => void;
  /** Abre o Pix: 'keys'/'limits' abrem o drawer U23; 'send'/'receive'
   *  abrem o PixModal existente (envio interno). */
  onOpenPix: (tab: 'send' | 'receive' | 'keys' | 'limits') => void;
  /** Abre o Tap (LeadsTapModal existente). */
  onOpenTap: () => void;
  /** Abre o SecurityCenterModal existente. */
  onOpenSecurity: () => void;
  onLogout: () => void;
  onOpenAdminReview: () => void;
  isAdmin: boolean;
  syncState: SyncStateShape;
  shellUi: ShellUi;
  setShellUi: (patch: Partial<ShellUi>) => void;
  /**
   * U4 — bloqueio do cartão (v3.1 §6, otimista com reversão em erro no
   * App). Opcional: só existe quando o App fia o handler; sem ele, o
   * toggle da U4 fica desabilitado.
   */
  onToggleFreeze?: (cardId: string) => void | Promise<void>;
  /**
   * U4 — repasse do handler de limite do App (assinatura preservada da
   * CardsView antiga). A U4 NÃO expõe edição/exibição de limite na tela
   * (banido pelo plano: limit/usedLimit nunca aparecem) — o prop existe
   * no contrato, sem UI.
   */
  onUpdateLimit?: (cardId: string, newLimit: number) => void | Promise<void>;
  /**
   * U7 — "Atualizar página" (v3.2 §D7.5): re-anexa as 3 inscrições do
   * subscribeToUserAccount (cancelar + recriar). Opcional: sem ele, o
   * botão da U7 fica desabilitado. NÃO é reload da página.
   */
  onRefresh?: () => void;
  /** U22 — preferência de tema (v3.2 §D7.1); o App é o dono do estado. */
  themePref?: ThemePref;
  onThemePrefChange?: (pref: ThemePref) => void;
}
