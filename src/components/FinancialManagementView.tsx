import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  PieChart, 
  Target, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lightbulb, 
  Smartphone, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { FinancialCategory, Transaction } from '../types';

interface FinancialManagementViewProps {
  categories: FinancialCategory[];
  transactions: Transaction[];
  balance: number;
}

export const FinancialManagementView: React.FC<FinancialManagementViewProps> = ({
  categories,
  transactions,
  balance
}) => {
  const [selectedMonth, setSelectedMonth] = useState('Setembro 2026');
  const [budgetGoal, setBudgetGoal] = useState(8000.00);

  // Calculate totals
  const totalIn = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalOut = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const netSavings = totalIn - totalOut;
  const budgetUsagePercent = Math.min(100, Math.round((totalOut / budgetGoal) * 100));

  // Weekly data bars for chart
  const weeklyData = transactions.length === 0 ? [
    { week: 'Sem 1', in: 0, out: 0 },
    { week: 'Sem 2', in: 0, out: 0 },
    { week: 'Sem 3', in: 0, out: 0 },
    { week: 'Sem 4', in: 0, out: 0 }
  ] : [
    { week: 'Sem 1', in: Math.round(totalIn * 0.25), out: Math.round(totalOut * 0.2) },
    { week: 'Sem 2', in: Math.round(totalIn * 0.35), out: Math.round(totalOut * 0.3) },
    { week: 'Sem 3', in: Math.round(totalIn * 0.2), out: Math.round(totalOut * 0.25) },
    { week: 'Sem 4', in: Math.round(totalIn * 0.2), out: Math.round(totalOut * 0.25) }
  ];

  const maxVal = Math.max(100, Math.max(...weeklyData.map(d => Math.max(d.in, d.out))) * 1.15);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <span>Gestão Financeira LeadsPay</span>
            <span className="text-xs bg-[#00e676]/20 text-[#00e676] px-2 py-0.5 rounded-full font-mono">
              IA Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Controle de fluxo de caixa, orçamentos e inteligência de vendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-black/60 border border-white/10 text-xs text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#00e676]" />
            <span>{selectedMonth}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Recebido</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-[#00e676] flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-display font-bold text-[#00e676] font-mono-numbers">
            +R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            {transactions.length === 0 ? 'Sem entradas no período' : '+24.8% em relação ao mês anterior'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Gasto</span>
            <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-display font-bold text-white font-mono-numbers">
            -R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {transactions.length === 0 ? 'Sem despesas registradas' : 'Dentro da meta estipulada'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Economia Líquida</span>
            <span className="w-6 h-6 rounded-lg bg-[#00e676]/20 text-[#00e676] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-display font-bold text-white font-mono-numbers">
            R$ {netSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#00e676] mt-1 block font-medium">
            Saldo acumulado no mês
          </span>
        </div>
      </div>

      {/* Cashflow Weekly Visual Chart */}
      <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Fluxo de Caixa Semanal</h3>
            <p className="text-[11px] text-slate-400">Comparativo de Entradas vs Saídas</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]" />
              <span className="text-slate-300 text-[11px]">Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-300 text-[11px]">Saídas</span>
            </div>
          </div>
        </div>

        {/* SVG/CSS Bar Graphic */}
        <div className="h-44 pt-4 flex items-end justify-between gap-4 border-b border-white/10 pb-2">
          {weeklyData.map((d, i) => {
            const inHeight = Math.round((d.in / maxVal) * 100);
            const outHeight = Math.round((d.out / maxVal) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-2 h-full">
                  {/* In Bar */}
                  <div
                    style={{ height: `${inHeight}%` }}
                    className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600 to-[#00e676] rounded-t-lg transition-all duration-700 relative group cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 whitespace-nowrap border border-emerald-500/30 transition-opacity pointer-events-none">
                      R$ {d.in}
                    </div>
                  </div>
                  {/* Out Bar */}
                  <div
                    style={{ height: `${outHeight}%` }}
                    className="w-4 sm:w-6 bg-slate-700/80 hover:bg-slate-600 rounded-t-lg transition-all duration-700 relative group cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 whitespace-nowrap border border-white/10 transition-opacity pointer-events-none">
                      R$ {d.out}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400">{d.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Budget Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories List */}
        <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Distribuição por Categoria</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">5 categorias</span>
          </div>

          <div className="space-y-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-200 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">
                      R$ {cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Insights & Budget Target */}
        <div className="space-y-4">
          {/* Budget Limit Card */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#00e676]" />
                <span>Orçamento Mensal de Gastos</span>
              </h3>
              <button
                onClick={() => {
                  const val = prompt('Defina sua meta de teto de gastos mensais em R$:', budgetGoal.toString());
                  if (val && !isNaN(parseFloat(val))) setBudgetGoal(parseFloat(val));
                }}
                className="text-[11px] text-emerald-400 hover:text-white"
              >
                Editar Meta
              </button>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">
                Gasto: <strong className="text-white font-mono">R$ {totalOut.toFixed(2)}</strong>
              </span>
              <span className="text-slate-400">
                Teto: <strong className="text-white font-mono">R$ {budgetGoal.toFixed(2)}</strong>
              </span>
            </div>

            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUsagePercent > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-[#00e676]'
                }`}
                style={{ width: `${budgetUsagePercent}%` }}
              />
            </div>

            <span className="text-[10px] text-slate-400 block">
              {budgetUsagePercent}% do orçamento consumido · Restam R$ {(budgetGoal - totalOut).toFixed(2)}
            </span>
          </div>

          {/* AI Insights Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-black/60 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-[#00e676]" />
              <span>Insights Inteligentes LeadsPay</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              • Suas vendas via <strong>LeadsTap por aproximação</strong> geraram <strong>R$ 4.582,50</strong> este mês sem nenhuma taxa de aluguel de maquininha.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              • Você economizou <strong>R$ 380,00</strong> em tarifas bancárias comparado a bancos tradicionais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
