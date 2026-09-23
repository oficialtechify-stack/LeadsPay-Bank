import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Smartphone, 
  CreditCard, 
  Receipt, 
  Share2, 
  Download, 
  X, 
  ShieldCheck, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { BrandLogo } from './BrandLogo';

interface ExtratoViewProps {
  transactions: Transaction[];
  onBackToDashboard: () => void;
}

export const ExtratoView: React.FC<ExtratoViewProps> = ({
  transactions,
  onBackToDashboard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Filter logic
  const filtered = transactions.filter((tx) => {
    // Search matching
    const matchSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.recipientOrSender && tx.recipientOrSender.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type matching
    let matchType = true;
    if (selectedType === 'pix') {
      matchType = tx.type === 'pix_in' || tx.type === 'pix_out';
    } else if (selectedType === 'tap') {
      matchType = tx.type === 'tap_to_pay';
    } else if (selectedType === 'card') {
      matchType = tx.type === 'card_payment';
    } else if (selectedType === 'in') {
      matchType = tx.amount > 0;
    } else if (selectedType === 'out') {
      matchType = tx.amount < 0;
    }

    return matchSearch && matchType;
  });

  const getTxIcon = (tx: Transaction) => {
    if (tx.type === 'tap_to_pay') {
      return <Smartphone className="w-4 h-4 text-[#00e676]" />;
    }
    if (tx.type === 'card_payment') {
      return <CreditCard className="w-4 h-4 text-blue-400" />;
    }
    if (tx.amount > 0) {
      return <ArrowDownLeft className="w-4 h-4 text-[#00e676]" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header bar with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Extrato Detalhado
            </h2>
            <p className="text-xs text-slate-400">
              Histórico completo de entradas, saídas e vendas LeadsTap
            </p>
          </div>
        </div>

        <span className="text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
          {filtered.length} transações
        </span>
      </div>

      {/* Search and Period Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, valor, Pix ou estabelecimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'tap', label: 'LeadsTap (Aproximação)' },
            { id: 'pix', label: 'Pix Instantâneo' },
            { id: 'card', label: 'Cartões' },
            { id: 'in', label: 'Entradas (+)' },
            { id: 'out', label: 'Saídas (-)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedType === item.id
                  ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-black/50 border border-white/10 rounded-3xl p-3 sm:p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium">Nenhuma transação encontrada</p>
            <p className="text-xs text-slate-500">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isPositive = tx.amount > 0;
            return (
              <div
                key={tx.id}
                onClick={() => setActiveReceipt(tx)}
                className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    tx.type === 'tap_to_pay' 
                      ? 'bg-emerald-950/80 border-[#00e676]/30'
                      : isPositive
                        ? 'bg-emerald-950/50 border-emerald-500/20'
                        : 'bg-white/5 border-white/10'
                  }`}>
                    {getTxIcon(tx)}
                  </div>

                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block group-hover:text-[#00e676] transition-colors">
                      {tx.title}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[180px] sm:max-w-xs">
                      {tx.recipientOrSender || tx.description}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {tx.dateFormatted} · {tx.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm sm:text-base font-bold font-mono-numbers ${
                    isPositive ? 'text-[#00e676]' : 'text-slate-100'
                  }`}>
                    {isPositive ? '+' : ''}R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 uppercase font-semibold">
                    Ver comprovante ›
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official Comprovante Bancário LeadsPay Modal */}
      <AnimatePresence>
        {activeReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0d1410] border border-emerald-500/40 rounded-3xl p-6 text-white space-y-4 shadow-[0_0_50px_rgba(0,230,118,0.25)]"
            >
              <button
                onClick={() => setActiveReceipt(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Receipt Header */}
              <div className="text-center pt-2">
                <BrandLogo size="sm" className="justify-center mb-2" />
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-[#00e676]" />
                  <span>Comprovante de Transação</span>
                </div>
                <div className="text-3xl font-display font-black text-white mt-3">
                  {activeReceipt.amount > 0 ? '+' : '-'}R$ {Math.abs(activeReceipt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-slate-400">{activeReceipt.title}</span>
              </div>

              {/* Digital Proof Details */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="text-slate-400 font-sans">Status</span>
                  <span className="text-emerald-400 font-bold">Liquidado com Sucesso</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Data & Hora</span>
                  <span className="text-slate-200">{activeReceipt.dateFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Destinatário/Origem</span>
                  <span className="text-white font-sans font-medium text-right max-w-[170px] truncate">
                    {activeReceipt.recipientOrSender || 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Autenticação</span>
                  <span className="text-emerald-300">{activeReceipt.authMethod || 'Token de Segurança'}</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] text-slate-500 block font-sans">ID de Autenticação Digital</span>
                  <span className="text-[10px] text-slate-300 break-all">
                    {activeReceipt.e2eId || 'E592' + activeReceipt.id.toUpperCase() + 'AUTH'}
                  </span>
                </div>
              </div>

              {/* Share and Download Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => alert('Comprovante em PDF baixado com sucesso!')}
                  className="py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>
                <button
                  onClick={() => alert('Link do comprovante compartilhado!')}
                  className="py-2.5 bg-[#00e676] hover:bg-[#00c853] text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
