import React from 'react';
import { CreditCard, Home, ReceiptText, Settings } from 'lucide-react';
import type { Route } from '../lib/routes';
import { bottomActive } from '../lib/routes';

/**
 * Bottom nav flutuante translúcida, tema claro: fundo branco translúcido,
 * item ativo preto, tile central preto em destaque.
 *
 * Q-nav1 = (B): o tile central "Vender" é ROTA para a aba Vendas — o Tap
 * abre de dentro da Vendas ("Vender agora"), nunca do centro.
 * Q1: o 5º item é Ajustes (Jim não existe, não entra).
 * Slots: Início (→ Conta), Extrato (→ extrato), Vender (centro, → vendas),
 * Cartão (→ CardsView, que existe no Bank), Ajustes (→ AjustesView).
 * O ativo acompanha a rota (bottomActive) e nunca contradiz a pílula.
 */
export const BottomNavBar: React.FC<{
  route: Route;
  onNavigate: (route: Route) => void;
}> = ({ route, onNavigate }) => {
  const active = bottomActive(route);

  const items: {
    id: 'inicio' | 'extrato' | 'cartao' | 'ajustes' | 'vender';
    label: string;
    route: Route;
    Icon?: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'inicio', label: 'Início', route: { name: 'conta' }, Icon: Home },
    { id: 'extrato', label: 'Extrato', route: { name: 'extrato' }, Icon: ReceiptText },
    { id: 'cartao', label: 'Cartão', route: { name: 'cartao' }, Icon: CreditCard },
    { id: 'ajustes', label: 'Ajustes', route: { name: 'ajustes' }, Icon: Settings },
    { id: 'vender', label: 'Vender', route: { name: 'vendas' } },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end justify-between rounded-full bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-lg shadow-black/10 px-3 py-2">
          {items.map(({ id, label, route: target, Icon }) => {
            const isActive = active === id;
            if (id === 'vender') {
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(target)}
                  aria-label="Vender"
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-[18px] bg-zinc-950">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[conic-gradient(from_0deg,#00e676,#a855f7,#00e676)]">
                      <span className="w-3 h-3 rounded-full bg-zinc-950" />
                    </span>
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-950">{label}</span>
                </button>
              );
            }
            const ItemIcon = Icon as React.ComponentType<{ className?: string }>;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(target)}
                aria-label={label}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl ${
                  isActive ? 'text-zinc-950' : 'text-zinc-400'
                }`}
              >
                <ItemIcon className="w-6 h-6" />
                <span className="text-[11px] font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
