import React from 'react';
import { 
  Landmark, 
  DollarSign, 
  Wallet, 
  Settings, 
  Radio,
  CreditCard
} from 'lucide-react';

export type MainTab = 'dashboard' | 'extrato' | 'cards' | 'ajustes' | 'leadstap' | 'finance' | 'devapi';

interface BottomNavBarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenLeadsTap: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLeadsTap
}) => {
  return (
    <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md pointer-events-none">
      <nav className="pointer-events-auto relative w-full h-[66px] bg-[#0c130f]/95 backdrop-blur-xl border border-white/10 rounded-[32px] px-3 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center justify-between">
        {/* Item 1: Conta */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'dashboard'
              ? 'text-[#00e676]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-5 h-5 mb-0.5" />
          <span className={`text-[11px] font-medium tracking-tight ${
            currentTab === 'dashboard' ? 'font-semibold text-[#00e676]' : ''
          }`}>
            Conta
          </span>
        </button>

        {/* Item 2: Vendas */}
        <button
          onClick={() => onSelectTab('extrato')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'extrato'
              ? 'text-[#00e676]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center font-bold text-base mb-0.5">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className={`text-[11px] font-medium tracking-tight ${
            currentTab === 'extrato' ? 'font-semibold text-[#00e676]' : ''
          }`}>
            Vendas
          </span>
        </button>

        {/* Item 3: Center Elevated Floating Circle (LeadsTap / Contactless Action) */}
        <div className="relative -top-5 flex flex-col items-center justify-center px-1.5">
          <button
            onClick={onOpenLeadsTap}
            title="LeadsTap - Pagar e Receber por Aproximação"
            className="w-14 h-14 rounded-full bg-gradient-to-b from-[#34d399] via-[#00e676] to-[#059669] flex items-center justify-center text-black shadow-[0_0_25px_rgba(0,230,118,0.5)] border-4 border-[#080d0a] active:scale-95 hover:scale-105 transition-all group cursor-pointer"
          >
            {/* LeadsTap Contactless Waves Icon */}
            <Radio className="w-6 h-6 text-black group-hover:rotate-12 transition-transform drop-shadow" />
          </button>
        </div>

        {/* Item 4: Cartões */}
        <button
          onClick={() => onSelectTab('cards')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'cards'
              ? 'text-[#00e676]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className={`text-[11px] font-medium tracking-tight ${
            currentTab === 'cards' ? 'font-semibold text-[#00e676]' : ''
          }`}>
            Cartões
          </span>
        </button>

        {/* Item 5: Ajustes */}
        <button
          onClick={() => onSelectTab('ajustes')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'ajustes'
              ? 'text-[#00e676]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className={`text-[11px] font-medium tracking-tight ${
            currentTab === 'ajustes' ? 'font-semibold text-[#00e676]' : ''
          }`}>
            Ajustes
          </span>
        </button>
      </nav>
    </div>
  );
};
