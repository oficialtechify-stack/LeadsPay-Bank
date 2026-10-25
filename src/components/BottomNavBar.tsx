import React from 'react';
import { Home, Receipt, Zap, QrCode, Settings } from 'lucide-react';

export type MainTab = 'inicio' | 'extrato' | 'cobrar' | 'pix' | 'ajustes';

interface BottomNavBarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

const TABS: { id: MainTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inicio', label: 'Início', Icon: Home },
  { id: 'extrato', label: 'Extrato', Icon: Receipt },
  { id: 'cobrar', label: 'Cobrar', Icon: Zap },
  { id: 'pix', label: 'Pix', Icon: QrCode },
  { id: 'ajustes', label: 'Ajustes', Icon: Settings },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0c0d]/95 backdrop-blur border-t border-white/10">
      <div className="max-w-2xl mx-auto px-2 py-2 grid grid-cols-5">
        {TABS.map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] ${
                active ? 'text-[#00e676]' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
