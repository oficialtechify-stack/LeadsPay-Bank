import React from 'react';
import { Check, Coins, Flag, Flame, Lock, Trophy } from 'lucide-react';
import {
  computeAchievements,
  computeCoins,
  computeMissions,
  computeStreak,
} from '../lib/missions';
import type { Transaction } from '../types';
import { Card, SectionTitle } from './ui';

/**
 * Aba Moedas (§4.4 do plano v2, Q3=(a)) — missões derivadas de transações
 * reais, lista fechada: (1) primeira venda Tap; (2) 5 vendas no mês;
 * (3) 7 dias seguidos com movimento. Conta nova: 0 moedas. Missões
 * cumpridas só com transação real; moedas NÃO valem reais.
 */
export const MoedasView: React.FC<{
  transactions: Transaction[];
}> = ({ transactions }) => {
  const missions = computeMissions(transactions);
  const doneCount = missions.filter((m) => m.done).length;
  const coins = computeCoins(missions);
  const streak = computeStreak(transactions);
  const achievements = computeAchievements(transactions);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-5">
      {/* Missões */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white shrink-0">
            <Flag className="w-7 h-7 text-violet-600" />
          </span>
          <div className="flex-1">
            <p className="text-[26px] font-extrabold tracking-[-0.02em] leading-none text-zinc-950">
              {doneCount}
              <span className="text-zinc-400">/{missions.length}</span>
            </p>
            <p className="text-sm text-zinc-500 mt-1">Conclua as missões</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2.5">
          {missions.map((m) => (
            <li key={m.id} className="flex items-center gap-3 text-[15px]">
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                  m.done ? 'bg-[#00e676] text-black' : 'bg-white text-zinc-400'
                }`}
              >
                {m.done ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-zinc-300" />}
              </span>
              <span className={m.done ? 'text-zinc-900 font-medium' : 'text-zinc-500'}>
                {m.title}
              </span>
              <span className="ml-auto text-xs font-semibold text-zinc-400">+10</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Saldo / Ofensiva / Conquistas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[24px] bg-[#f4f4f5] p-4">
          <Coins className="w-7 h-7 text-zinc-900" />
          <p className="text-[22px] font-extrabold tracking-[-0.02em] mt-3 tabular-nums text-zinc-950">
            {coins}
          </p>
          <p className="text-sm text-zinc-500">Saldo</p>
        </div>
        <div className="rounded-[24px] bg-[#f4f4f5] p-4">
          <Flame className="w-7 h-7 text-zinc-900" />
          <p className="text-[22px] font-extrabold tracking-[-0.02em] mt-3 tabular-nums text-zinc-950">
            {streak}
          </p>
          <p className="text-sm text-zinc-500">Ofensiva</p>
        </div>
        <div className="rounded-[24px] bg-[#f4f4f5] p-4">
          <Trophy className="w-7 h-7 text-zinc-900" />
          <p className="text-[22px] font-extrabold tracking-[-0.02em] mt-3 tabular-nums text-zinc-950">
            {unlockedCount}
          </p>
          <p className="text-sm text-zinc-500">Conquistas</p>
        </div>
      </div>

      {/* Conquistas */}
      <div>
        <SectionTitle>Conquistas</SectionTitle>
        <div className="mt-3 space-y-2.5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-[20px] p-4 ${
                a.unlocked ? 'bg-[#f4f4f5]' : 'bg-[#f4f4f5] opacity-60'
              }`}
            >
              {a.unlocked ? (
                <Trophy className="w-6 h-6 text-zinc-900 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-zinc-400 shrink-0" />
              )}
              <div>
                <p className="text-[15px] font-semibold text-zinc-950">{a.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{a.detail}</p>
              </div>
              {a.unlocked && (
                <span className="ml-auto rounded-full bg-[#00e676] px-2.5 py-1 text-[11px] font-bold text-black">
                  Ganho
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
          Moedas valem só dentro do app — não valem reais, desconto ou prêmio.
        </p>
      </div>
    </div>
  );
};
