import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatBRL, formatTimestamp } from '../lib/format';
import type { LedgerEntry } from '../types';
import { entryLabel } from './DashboardView';

export const ExtratoView: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Extrato</h1>
      {entries.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-400">
            Nenhum movimento ainda. Seu extrato começa vazio — e só mostra o que
            realmente aconteceu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {e.amountCents >= 0 ? (
                    <ArrowDownLeft className="w-5 h-5 text-[#00e676] shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{entryLabel(e.type)}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {e.description || e.counterpartyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTimestamp(e.createdAt)}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-mono-numbers text-sm shrink-0 ${
                    e.amountCents >= 0 ? 'text-[#00e676]' : 'text-slate-200'
                  }`}
                >
                  {e.amountCents >= 0 ? '+' : ''}
                  {formatBRL(e.amountCents)}
                </p>
              </div>
              {e.type === 'tap_receipt' &&
                e.grossCents !== undefined &&
                e.feeCents !== undefined && (
                  <p className="text-xs text-slate-500 mt-2 pl-8">
                    Bruto {formatBRL(e.grossCents)} → taxa {formatBRL(e.feeCents)} →
                    líquido {formatBRL(e.amountCents)}
                  </p>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
