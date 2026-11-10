import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { FinancialCategory, Transaction } from '../types';
import { txDate } from '../lib/missions';

interface FinancialManagementViewProps {
  categories: FinancialCategory[];
  transactions: Transaction[];
  balance: number;
}

/**
 * Gestão Financeira (§4.3, §7.5 do plano v2) — tema claro, só dados reais.
 *
 * - Mês = mês corrente real (não mais a string fixa "Setembro 2026").
 * - Totais, gráfico semanal e categorias são do MÊS CORRENTE, derivados
 *   dos `timestamp`s reais das transações — o gráfico fabricado
 *   (`totalIn × 25%/35%/20%/20%`) foi removido.
 * - Sem meta definida: mostra "sem meta definida" em vez de R$ 8.000,00.
 * - Insights fixos removidos ("vendas geraram R$ 4.582,50", "economizou
 *   R$ 380,00") e o "+24,8% em relação ao mês anterior" também — não há
 *   dado de mês anterior no app para comparar.
 * - "IA Analytics" removido do título: não há IA na Gestão.
 */
export const FinancialManagementView: React.FC<FinancialManagementViewProps> = ({
  categories,
  transactions,
}) => {
  // Sem meta definida por padrão (null) — nada de R$ 8.000,00 inventado.
  const [budgetGoal, setBudgetGoal] = useState<number | null>(null);

  const now = new Date();
  const monthLabel = now
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());

  const isCurrentMonth = (tx: Transaction): boolean => {
    const d = txDate(tx);
    return d !== null && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const monthTxs = transactions.filter(isCurrentMonth);

  // Totais do mês corrente, derivados das transações reais.
  const totalIn = monthTxs.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalOut = monthTxs.filter((t) => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const netSavings = totalIn - totalOut;
  const budgetUsagePercent = budgetGoal
    ? Math.min(100, Math.round((totalOut / budgetGoal) * 100))
    : 0;

  // Fluxo semanal derivado dos timestamps reais (semanas do mês: 1-7, 8-14, 15-21, 22-31).
  const weeklyData = [0, 1, 2, 3].map((w) => {
    const weekTxs = monthTxs.filter((tx) => {
      const d = txDate(tx);
      if (!d) return false;
      const week = d.getDate() <= 7 ? 0 : d.getDate() <= 14 ? 1 : d.getDate() <= 21 ? 2 : 3;
      return week === w;
    });
    return {
      week: `Sem ${w + 1}`,
      in: weekTxs.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0),
      out: weekTxs.filter((t) => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0),
    };
  });

  const maxVal = Math.max(100, Math.max(...weeklyData.map((d) => Math.max(d.in, d.out))) * 1.15);

  // Categorias: valores recalculados das transações reais do mês (o
  // `percentage` do mock era sempre 0 e nunca era recalculado).
  const categoryOf = (tx: Transaction): string => {
    switch (tx.category) {
      case 'Vendas':
        return 'Vendas & LeadsTap';
      case 'Serviços':
        return 'Serviços & Software';
      case 'Alimentação':
        return 'Alimentação & Café';
      case 'Transporte':
        return 'Transporte & Viagens';
      default:
        return 'Outros & Lojas';
    }
  };
  const derivedCategories = categories.map((cat) => {
    const amount = monthTxs
      .filter((tx) => categoryOf(tx) === cat.name)
      .reduce((acc, tx) => acc + tx.amount, 0);
    return { ...cat, amount };
  });
  const totalAbs = derivedCategories.reduce((acc, c) => acc + Math.abs(c.amount), 0);
  const withPercentage = derivedCategories.map((cat) => ({
    ...cat,
    percentage: totalAbs > 0 ? Math.round((Math.abs(cat.amount) / totalAbs) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
            Gestão Financeira LeadsPay
          </h2>
          <p className="text-xs text-zinc-500">
            Controle de fluxo de caixa, orçamentos e categorias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#f4f4f5] border border-black/[0.06] text-xs text-zinc-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#00a854]" />
            <span>{monthLabel}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#f4f4f5] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Total Recebido</span>
            <span className="w-6 h-6 rounded-lg bg-[#00e676]/15 text-[#00a854] flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#00a854] font-mono-numbers">
            +R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            {monthTxs.length === 0 ? 'Sem entradas no período' : 'Entradas do mês'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f4f4f5] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Total Gasto</span>
            <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-950 font-mono-numbers">
            -R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            {monthTxs.length === 0 ? 'Sem despesas registradas' : 'Saídas do mês'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f4f4f5] border border-[#00e676]/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Economia Líquida</span>
            <span className="w-6 h-6 rounded-lg bg-[#00e676]/15 text-[#00a854] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-950 font-mono-numbers">
            R$ {netSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#00a854] mt-1 block font-medium">
            Saldo acumulado no mês
          </span>
        </div>
      </div>

      {/* Cashflow Weekly Visual Chart — barras derivadas dos timestamps reais */}
      <div className="p-5 rounded-3xl bg-[#f4f4f5] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Fluxo de Caixa Semanal</h3>
            <p className="text-[11px] text-zinc-500">Comparativo de Entradas vs Saídas</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]" />
              <span className="text-zinc-600 text-[11px]">Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <span className="text-zinc-600 text-[11px]">Saídas</span>
            </div>
          </div>
        </div>

        {/* SVG/CSS Bar Graphic */}
        <div className="h-44 pt-4 flex items-end justify-between gap-4 border-b border-black/[0.06] pb-2">
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
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-950 px-2 py-0.5 rounded text-[10px] font-mono text-[#00e676] whitespace-nowrap transition-opacity pointer-events-none">
                      R$ {d.in}
                    </div>
                  </div>
                  {/* Out Bar */}
                  <div
                    style={{ height: `${outHeight}%` }}
                    className="w-4 sm:w-6 bg-zinc-300 hover:bg-zinc-400 rounded-t-lg transition-all duration-700 relative group cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-950 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200 whitespace-nowrap transition-opacity pointer-events-none">
                      R$ {d.out}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-zinc-500">{d.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Budget Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories List */}
        <div className="p-5 rounded-3xl bg-[#f4f4f5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-[#00a854]" />
              <span>Distribuição por Categoria</span>
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">{withPercentage.length} categorias</span>
          </div>

          <div className="space-y-3">
            {withPercentage.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-zinc-800 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-950">
                      R$ {cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {totalAbs > 0 && (
                      <span className="text-zinc-500 text-[10px] font-mono">
                        ({cat.percentage}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Target */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#f4f4f5] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#00a854]" />
                <span>Orçamento Mensal de Gastos</span>
              </h3>
              <button
                onClick={() => {
                  const val = prompt('Defina sua meta de teto de gastos mensais em R$:', budgetGoal?.toString() ?? '');
                  if (val && !isNaN(parseFloat(val))) setBudgetGoal(parseFloat(val));
                }}
                className="text-[11px] text-[#00a854] hover:text-zinc-950"
              >
                Editar Meta
              </button>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-zinc-500">
                Gasto: <strong className="text-zinc-950 font-mono">R$ {totalOut.toFixed(2)}</strong>
              </span>
              <span className="text-zinc-500">
                Teto:{' '}
                <strong className="text-zinc-950 font-mono">
                  {budgetGoal === null ? 'sem meta definida' : `R$ ${budgetGoal.toFixed(2)}`}
                </strong>
              </span>
            </div>

            {budgetGoal !== null && (
              <>
                <div className="w-full h-2.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetUsagePercent > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-[#00e676]'
                    }`}
                    style={{ width: `${budgetUsagePercent}%` }}
                  />
                </div>

                <span className="text-[10px] text-zinc-500 block">
                  {budgetUsagePercent}% do orçamento consumido · Restam R$ {(budgetGoal - totalOut).toFixed(2)}
                </span>
              </>
            )}
            {budgetGoal === null && (
              <span className="text-[10px] text-zinc-500 block">
                Sem meta definida — toque em Editar Meta para definir um teto de gastos.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
