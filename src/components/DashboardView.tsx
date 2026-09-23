import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  CreditCard, 
  PieChart, 
  Code2, 
  ChevronRight, 
  Sparkles, 
  Barcode
} from 'lucide-react';
import { UserProfile, Transaction, VirtualCard } from '../types';

interface DashboardViewProps {
  userProfile: UserProfile;
  showBalance: boolean;
  transactions: Transaction[];
  cards: VirtualCard[];
  onOpenPix: () => void;
  onOpenTapToPay: () => void;
  onOpenCards: () => void;
  onOpenExtrato: () => void;
  onOpenFinance: () => void;
  onOpenDevApi: () => void;
  onOpenSecurity: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  showBalance,
  transactions,
  cards,
  onOpenPix,
  onOpenTapToPay,
  onOpenCards,
  onOpenExtrato,
  onOpenFinance,
  onOpenDevApi,
  onOpenSecurity
}) => {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Hero Balance Card */}
      <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0e1610] via-[#090e0b] to-[#040605] border border-emerald-500/30 overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        {/* Glow ambient circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              Saldo em Conta Corrente
            </span>
            <span className="font-mono text-emerald-400">Rendimento 105% CDI</span>
          </div>

          {/* Big Balance Number */}
          <div className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight font-mono-numbers my-1">
            {showBalance ? (
              <>
                <span className="text-xl sm:text-2xl font-normal text-emerald-400 mr-1.5">R$</span>
                {userProfile.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </>
            ) : (
              <span className="tracking-widest text-slate-500 text-2xl font-mono">••••••••</span>
            )}
          </div>

          {/* Invested Balance secondary pill */}
          {!userProfile.streetProtectionMode && (
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span>Investimentos automáticos:</span>
              <strong className="text-slate-200 font-mono">
                {showBalance ? `R$ ${userProfile.investedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••'}
              </strong>
            </div>
          )}

          {/* Quick Shortcuts Bar below balance */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <button
                onClick={onOpenPix}
                className="text-emerald-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Enviar Pix</span>
              </button>
              <button
                onClick={onOpenPix}
                className="text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#00e676]" />
                <span>Receber Pix</span>
              </button>
            </div>

            <button
              onClick={onOpenExtrato}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Ver extrato</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Grid (Bank Services) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Serviços Principais
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">Disponíveis 24/7</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
          {/* Action 1: Pix */}
          <button
            onClick={onOpenPix}
            className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00e676] mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white">Área Pix</span>
            <span className="text-[10px] text-slate-400">Instantâneo</span>
          </button>

          {/* Action 2: LeadsTap */}
          <button
            onClick={onOpenTapToPay}
            className="p-3 rounded-2xl bg-black/50 border border-[#00e676]/30 hover:border-[#00e676] hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#00e676] mb-2 group-hover:scale-110 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white">LeadsTap</span>
            <span className="text-[10px] text-emerald-400">Aproximação</span>
          </button>

          {/* Action 3: Cartões */}
          <button
            onClick={onOpenCards}
            className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white">Cartões</span>
            <span className="text-[10px] text-slate-400">Virtual & Físico</span>
          </button>

          {/* Action 4: Extrato */}
          <button
            onClick={onOpenExtrato}
            className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-2 group-hover:scale-110 transition-transform">
              <Barcode className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white">Extrato</span>
            <span className="text-[10px] text-slate-400">Detalhado</span>
          </button>

          {/* Action 5: Gestão Financeira */}
          <button
            onClick={onOpenFinance}
            className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white">Gestão</span>
            <span className="text-[10px] text-slate-400">Analytics IA</span>
          </button>

          {/* Action 6: Dev Portal API */}
          <button
            onClick={onOpenDevApi}
            className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white">Dev API</span>
            <span className="text-[10px] text-slate-400">Integração</span>
          </button>
        </div>
      </div>

      {/* Recent Movements Section - Clean & Responsive Full Width */}
      <div className="p-4 sm:p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Últimas Movimentações</h3>
          <button
            onClick={onOpenExtrato}
            className="text-xs text-emerald-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <span>Ver extrato completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-3 rounded-2xl bg-white/[0.01] border border-dashed border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00e676] flex items-center justify-center mx-auto">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Nenhuma movimentação registrada</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Receba vendas via LeadsTap por aproximação ou envie/receba um Pix.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onOpenTapToPay}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00e676] text-xs font-medium border border-emerald-500/30 transition-colors"
                >
                  Cobrar com LeadsTap
                </button>
                <button
                  onClick={onOpenPix}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                >
                  Área Pix
                </button>
              </div>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  onClick={onOpenExtrato}
                  className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      tx.type === 'tap_to_pay'
                        ? 'bg-emerald-950/80 border-[#00e676]/30 text-[#00e676]'
                        : isPositive
                          ? 'bg-emerald-950/40 border-emerald-500/20 text-[#00e676]'
                          : 'bg-white/5 border-white/10 text-slate-300'
                    }`}>
                      {tx.type === 'tap_to_pay' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {tx.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[130px] sm:max-w-xs">
                        {tx.recipientOrSender || tx.description}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-bold font-mono-numbers ${
                      isPositive ? 'text-[#00e676]' : 'text-slate-100'
                    }`}>
                      {isPositive ? '+' : ''}R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {tx.dateFormatted}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};
