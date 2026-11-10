import React, { useState } from 'react';
import {
  AtSign,
  CalendarDays,
  ChevronDown,
  CreditCard,
  CircleHelp,
  FileText,
  Gift,
  GraduationCap,
  HandCoins,
  Home,
  Landmark,
  Link,
  LogOut,
  MoreVertical,
  Package,
  ReceiptText,
  Repeat,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { Route } from '../../lib/routes';
import type { UserProfile } from '../../types';
import type { ShellUi } from './types';
import { maskEmail } from './shared';

type SidebarItem =
  | { kind: 'link'; label: string; Icon: React.ComponentType<{ className?: string }>; route: Route }
  | { kind: 'opener'; label: string; Icon: React.ComponentType<{ className?: string }>; open: 'linkBio' | 'ajuda' };

/**
 * Sidebar desktop (v3.2 §D4.1): 20 links de página + 2 abridores + rodapé.
 * Colapsada 72px; expande no hover como overlay (264px) — a margem de
 * conteúdo fica sempre em 72px. Tablet (768–1023px): fixa 72px, toque no
 * logotipo expande como overlay.
 */
const BANK_GROUP_ROUTES: Route['name'][] = ['extrato', 'cartao', 'emprestimo'];

export const Sidebar: React.FC<{
  route: Route;
  navigate: (next: Route, opts?: Partial<ShellUi>) => void;
  shellUi: ShellUi;
  setShellUi: (patch: Partial<ShellUi>) => void;
  userProfile: UserProfile;
  onLogout: () => void;
}> = ({ route, navigate, shellUi, setShellUi, userProfile, onLogout }) => {
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [tapExpanded, setTapExpanded] = useState(false);
  const [bankOpen, setBankOpen] = useState(BANK_GROUP_ROUTES.includes(route.name));
  const [menuOpen, setMenuOpen] = useState(false);
  const expanded = hoverExpanded || tapExpanded;

  const inBankGroup = BANK_GROUP_ROUTES.includes(route.name);

  const items: SidebarItem[] = [
    { kind: 'link', label: 'Home', Icon: Home, route: { name: 'conta' } },
    { kind: 'link', label: 'Assistente', Icon: Sparkles, route: { name: 'assistente' } },
    { kind: 'link', label: 'Suas vendas', Icon: TrendingUp, route: { name: 'vendas' } },
    { kind: 'link', label: 'Gestão de Cobrança', Icon: FileText, route: { name: 'gestao' } },
    { kind: 'link', label: 'Link de Pagamento', Icon: Link, route: { name: 'links-pagamento' } },
    { kind: 'link', label: 'Sua Loja Online', Icon: Store, route: { name: 'loja' } },
    { kind: 'link', label: 'Planos e Recorrências', Icon: Repeat, route: { name: 'planos' } },
    { kind: 'link', label: 'Agendamentos', Icon: CalendarDays, route: { name: 'agendamentos' } },
    { kind: 'link', label: 'Checkout', Icon: ShoppingCart, route: { name: 'checkout' } },
    { kind: 'link', label: 'Seu catálogo', Icon: Package, route: { name: 'catalogo' } },
    { kind: 'link', label: 'Cardápio', Icon: UtensilsCrossed, route: { name: 'cardapio' } },
    { kind: 'link', label: 'Seus recebimentos', Icon: Wallet, route: { name: 'recebimentos' } },
    { kind: 'link', label: 'Seus clientes', Icon: Users, route: { name: 'clientes' } },
    { kind: 'link', label: 'DAS MEI', Icon: FileText, route: { name: 'das-mei' } },
    { kind: 'opener', label: 'Seu Link na Bio', Icon: AtSign, open: 'linkBio' },
    { kind: 'link', label: 'Chargeback', Icon: ShieldAlert, route: { name: 'chargeback' } },
    { kind: 'link', label: 'Indique e ganhe', Icon: Gift, route: { name: 'indique' } },
    { kind: 'link', label: 'Academy', Icon: GraduationCap, route: { name: 'academy' } },
    { kind: 'opener', label: 'Central de Ajuda', Icon: CircleHelp, open: 'ajuda' },
  ];

  const bankChildren: SidebarItem[] = [
    { kind: 'link', label: 'Seu extrato', Icon: ReceiptText, route: { name: 'extrato' } },
    { kind: 'link', label: 'Cartões e mais', Icon: CreditCard, route: { name: 'cartao' } },
    { kind: 'link', label: 'Empréstimo Inteligente', Icon: HandCoins, route: { name: 'emprestimo' } },
  ];

  const isActive = (item: SidebarItem) =>
    item.kind === 'link' && item.route.name === route.name;

  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium transition-colors ${
      active
        ? 'bg-[var(--shell-lima)] text-black'
        : 'text-[var(--shell-text)] hover:bg-[var(--shell-surface-2)]'
    }`;

  const renderItem = (item: SidebarItem) => {
    const active = isActive(item);
    const onClick =
      item.kind === 'link'
        ? () => navigate(item.route)
        : () =>
            setShellUi(
              item.open === 'linkBio' ? { linkBioOpen: true } : { ajudaOpen: true }
            );
    return (
      <button key={item.label} type="button" onClick={onClick} className={itemClass(active)}>
        <item.Icon className="w-[18px] h-[18px] shrink-0" />
        <span
          className={`whitespace-nowrap transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <aside
      onMouseEnter={() => setHoverExpanded(true)}
      onMouseLeave={() => {
        setHoverExpanded(false);
        setMenuOpen(false);
      }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--shell-border)] bg-[var(--shell-surface)] py-4 transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: expanded ? 264 : 72 }}
      aria-label="Menu do painel"
    >
      {/* Logotipo — toque (tablet) expande/recolhe como overlay */}
      <button
        type="button"
        onClick={() => setTapExpanded((v) => !v)}
        className="mx-3 mb-4 flex h-10 items-center gap-3 rounded-[12px] px-1 text-left"
        aria-label="LeadsTap — expandir ou recolher o menu"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--shell-black)] text-[18px] font-bold text-[var(--shell-on-black)]">
          L
        </span>
        <span
          className={`whitespace-nowrap text-[16px] font-bold tracking-[-0.02em] transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          LeadsTap
        </span>
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar">
        {renderItem(items[0])}
        {renderItem(items[1])}

        {/* Grupo "Seu banco" (chevron): colapsado mostra só o ícone */}
        <div>
          <button
            type="button"
            onClick={() => setBankOpen((v) => !v)}
            className={itemClass(inBankGroup)}
            aria-expanded={bankOpen}
          >
            <Landmark className="w-[18px] h-[18px] shrink-0" />
            <span
              className={`flex-1 whitespace-nowrap text-left transition-opacity duration-200 ${
                expanded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Seu banco
            </span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                bankOpen ? 'rotate-180' : ''
              } ${expanded ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>
          {(bankOpen || inBankGroup) && (
            <div className="mt-1 space-y-1 border-l border-[var(--shell-border)] pl-2">
              {bankChildren.map(renderItem)}
            </div>
          )}
        </div>

        {items.slice(2).map(renderItem)}
      </nav>

      {/* Rodapé: card do usuário + ⋮ (só este ⋮ existe — o TopBar não tem) */}
      <div className="relative mt-4 border-t border-[var(--shell-border)] px-3 pt-4">
        <div className="flex items-center gap-3">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--shell-surface-2)] text-[14px] font-bold">
              {(userProfile.name || '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          <span
            className={`min-w-0 flex-1 transition-opacity duration-200 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="block truncate text-[14px] font-semibold leading-tight">
              {userProfile.name}
            </span>
            <span className="block truncate text-[12px] text-[var(--shell-muted)]">
              {maskEmail(userProfile.email)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Opções da conta"
            aria-expanded={menuOpen}
            className="shrink-0 rounded-full p-1.5 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)]"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface)] shadow-lg">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate({ name: 'ajustes' });
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] font-medium hover:bg-[var(--shell-surface-2)]"
            >
              <Settings className="w-4 h-4" /> Configurações
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] font-medium hover:bg-[var(--shell-surface-2)]"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
