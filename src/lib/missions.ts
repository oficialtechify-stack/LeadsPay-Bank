import type { Transaction } from '../types';

/**
 * Moedas, missões, ofensiva e conquistas — tudo derivado de transações reais.
 *
 * Adaptação do padrão da QA (`leadstap-qa/src/lib/missions.ts`) ao tipo
 * `Transaction` do Bank — o tipo `tap_receipt` da QA NÃO existe aqui.
 * Regras honestas (plano v2 §4.4, Q3=(a)):
 * - Moedas NÃO valem reais e não prometem desconto, saldo ou prêmio.
 * - Lista FECHADA de missões: (1) primeira venda Tap; (2) 5 vendas no mês;
 *   (3) 7 dias seguidos com movimento (ofensiva). Nenhuma missão pode
 *   nascer cumprida: "primeira chave Pix" e "primeiro cartão" são
 *   PROIBIDAS (§4.4) e não estão nesta lista.
 * - Venda = `tap_to_pay` com `amount > 0` (Q12=(A): pagar pelo Tap grava
 *   valor negativo e fica fora da contagem de vendas e das missões).
 */

export interface Mission {
  id: string;
  title: string;
  done: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
}

/** Venda Tap: cobrança por aproximação com valor positivo. */
export function isSale(tx: Transaction): boolean {
  return tx.type === 'tap_to_pay' && tx.amount > 0;
}

/**
 * Data da transação, ou null se o `timestamp` não for legível. Aceita ISO
 * (fluxo real do app) e milissegundos numéricos (prévia mock-tx).
 */
export function txDate(tx: Transaction): Date | null {
  const raw = tx.timestamp as unknown as string | number | null | undefined;
  if (raw === null || raw === undefined) return null;
  const d = typeof raw === 'number' ? new Date(raw) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameMonth(d: Date, ref: Date): boolean {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function isToday(d: Date, ref: Date): boolean {
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

/** Missões — lista fechada (Q3). Só contam com transação real. */
export function computeMissions(transactions: Transaction[]): Mission[] {
  const now = new Date();
  const sales = transactions.filter(isSale);
  const salesThisMonth = sales.filter((tx) => {
    const d = txDate(tx);
    return d !== null && isSameMonth(d, now);
  }).length;
  const streak = computeStreak(transactions);
  return [
    { id: 'first-sale', title: 'Faça sua primeira venda Tap', done: sales.length > 0 },
    { id: 'five-sales-month', title: 'Faça 5 vendas no mês', done: salesThisMonth >= 5 },
    { id: 'streak-7', title: '7 dias seguidos com movimento', done: streak >= 7 },
  ];
}

/** Moedas: 10 por missão concluída. Sem valor em reais, sem resgate. */
export function computeCoins(missions: Mission[]): number {
  return missions.filter((m) => m.done).length * 10;
}

/** Vendas de hoje — contagem e soma, só cobranças Tap positivas. */
export function computeSalesToday(transactions: Transaction[]): { count: number; total: number } {
  const now = new Date();
  const today = transactions.filter((tx) => {
    if (!isSale(tx)) return false;
    const d = txDate(tx);
    return d !== null && isToday(d, now);
  });
  return {
    count: today.length,
    total: today.reduce((acc, tx) => acc + tx.amount, 0),
  };
}

/**
 * Ofensiva: dias seguidos com pelo menos um movimento, contando até hoje
 * (ou até ontem, se hoje ainda não teve movimento — a sequência não quebra
 * por o dia ainda não ter acabado).
 */
export function computeStreak(transactions: Transaction[]): number {
  const days = new Set<string>();
  for (const tx of transactions) {
    const d = txDate(tx);
    if (d) days.add(toDayKey(d));
  }
  if (days.size === 0) return 0;
  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(toDayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Conquistas: espelham as missões; o resto fica travado. */
export function computeAchievements(transactions: Transaction[]): Achievement[] {
  const now = new Date();
  const sales = transactions.filter(isSale);
  const salesThisMonth = sales.filter((tx) => {
    const d = txDate(tx);
    return d !== null && isSameMonth(d, now);
  }).length;
  const streak = computeStreak(transactions);
  return [
    {
      id: 'first-sale',
      title: 'Primeira venda',
      detail: 'Receba sua primeira venda por aproximação',
      unlocked: sales.length >= 1,
    },
    {
      id: 'five-sales-month',
      title: '5 vendas no mês',
      detail: 'Receba 5 vendas Tap no mesmo mês',
      unlocked: salesThisMonth >= 5,
    },
    {
      id: 'streak-7',
      title: 'Ofensiva de 7 dias',
      detail: 'Movimente a conta 7 dias seguidos',
      unlocked: streak >= 7,
    },
  ];
}
