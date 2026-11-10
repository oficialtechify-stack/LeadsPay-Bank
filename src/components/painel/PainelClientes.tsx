import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Plus, Search, Upload, Users } from 'lucide-react';
import { EmptyState, SPRING, WhiteCard } from '../ui';
import { Skeleton } from './shared';
import type { PainelProps } from './types';

const SP = 'America/Sao_Paulo';

function parseTs(ts: string): Date | null {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Data ISO (aaaa-mm-dd) no fuso de São Paulo, para comparar períodos. */
function isoDay(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: SP });
}

function brl(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

type Period = 'all' | '7d' | '30d';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: '7d', label: 'Últ. 7 dias' },
  { id: '30d', label: 'Últ. 30 dias' },
];

const CSV_FILENAME = `leads-tap-clientes-${new Date()
  .toLocaleDateString('en-CA', { timeZone: SP })
  .replace(/-/g, '')}.csv`;

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: { name: string; total: number; last: string }[]): void {
  const header = ['Cliente', 'Total recebido (R$)', 'Última transação'].map(csvCell).join(',');
  const lines = rows.map((r) =>
    [
      csvCell(r.name),
      csvCell(r.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })),
      csvCell(r.last),
    ].join(',')
  );
  const blob = new Blob([[header, ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = CSV_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ClientRow = {
  name: string;
  total: number;
  lastLabel: string;
  lastMs: number;
};

/**
 * U17 — Seus clientes (v3.1 §8-U17 + v3.2 §D6.1).
 * A tabela tem SÓ as colunas que o dado sustenta: o cliente é
 * `recipientOrSender`; sem telefone/e-mail (não existem no dado).
 * "Total recebido" soma entradas concluídas; "Ver vendas" abre a U6
 * filtrada por aquele cliente.
 */
export const PainelClientes: React.FC<PainelProps> = ({
  transactions,
  syncState,
  navigate,
}) => {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<Period>('all');

  const loading = syncState.loading && transactions.length === 0;

  const rows = useMemo<ClientRow[]>(() => {
    const now = new Date();
    const todayIso = isoDay(now);
    const cutoffMs =
      period === 'all'
        ? null
        : now.getTime() - (period === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000;
    const byClient = new Map<string, ClientRow>();
    for (const tx of transactions) {
      const d = parseTs(tx.timestamp);
      if (cutoffMs !== null && (!d || d.getTime() < cutoffMs)) continue;
      const name = tx.recipientOrSender?.trim() || '—';
      let row = byClient.get(name);
      if (!row) {
        row = { name, total: 0, lastLabel: '—', lastMs: 0 };
        byClient.set(name, row);
      }
      if (tx.status === 'completed' && tx.amount > 0) row.total += tx.amount;
      if (d && d.getTime() > row.lastMs) {
        row.lastMs = d.getTime();
        row.lastLabel =
          isoDay(d) === todayIso
            ? `Hoje, ${tx.dateFormatted}`
            : tx.dateFormatted;
      }
    }
    return [...byClient.values()]
      .filter((r) => r.name !== '—')
      .filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => b.total - a.total || b.lastMs - a.lastMs);
  }, [transactions, period, query]);

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  return (
    <div>
      <motion.div {...stagger(0)}>
        <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
          <Users className="w-6 h-6" /> Seus clientes
        </h1>
        <p className="mt-1 text-[14px] text-[var(--shell-muted)]">
          Quem já comprou ou pagou você, com o total recebido de cada um.
        </p>
      </motion.div>

      <motion.div {...stagger(1)} className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          title="Importar clientes ainda não disponível."
          className="flex items-center gap-1.5 rounded-full bg-[#E5E5E5] px-4 py-2.5 text-[14px] font-semibold text-[#9CA3AF]"
        >
          <Upload className="w-4 h-4" /> Importar CSV
        </button>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() =>
              downloadCsv(rows.map((r) => ({ name: r.name, total: r.total, last: r.lastLabel })))
            }
            className="flex items-center gap-1.5 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-2.5 text-[14px] font-semibold text-[var(--shell-text)]"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        )}
        <button
          type="button"
          disabled
          title="Cadastro manual de clientes ainda não disponível."
          className="flex items-center gap-1.5 rounded-full bg-[#E5E5E5] px-4 py-2.5 text-[14px] font-semibold text-[#9CA3AF]"
        >
          <Plus className="w-4 h-4" /> Adicionar cliente
        </button>
      </motion.div>

      <motion.div {...stagger(2)} className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-2.5">
          <Search className="w-4 h-4 shrink-0 text-[var(--shell-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente"
            aria-label="Buscar cliente"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--shell-muted)]"
          />
        </div>
        <div
          className="flex rounded-full bg-[var(--shell-surface-2)] p-1"
          role="group"
          aria-label="Filtrar por período"
        >
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                period === p.id
                  ? 'bg-[var(--shell-black)] text-[var(--shell-on-black)]'
                  : 'text-[var(--shell-muted)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div {...stagger(3)} className="mt-4">
        {loading ? (
          <WhiteCard>
            <Skeleton lines={4} />
          </WhiteCard>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Você ainda não tem clientes."
            text="Quando alguém pagar você, o nome e o total recebido aparecem aqui."
          />
        ) : (
          <WhiteCard className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--shell-border)] text-[13px] text-[var(--shell-muted)]">
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Total recebido</th>
                    <th className="px-5 py-3 font-semibold">Última transação</th>
                    <th className="px-5 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.name}
                      className="border-b border-[var(--shell-border)] last:border-0"
                    >
                      <td className="px-5 py-3.5 font-semibold">{r.name}</td>
                      <td className="px-5 py-3.5 tabular-nums">{brl(r.total)}</td>
                      <td className="px-5 py-3.5 text-[var(--shell-muted)]">{r.lastLabel}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate({ name: 'nova-cobranca' })}
                            className="rounded-full bg-[var(--shell-surface-2)] px-3 py-1.5 text-[13px] font-semibold"
                          >
                            Nova cobrança
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                { name: 'vendas' },
                                { salesTab: 'table', salesClientFilter: r.name }
                              )
                            }
                            className="rounded-full bg-[var(--shell-surface-2)] px-3 py-1.5 text-[13px] font-semibold"
                          >
                            Ver vendas
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WhiteCard>
        )}
      </motion.div>
    </div>
  );
};
