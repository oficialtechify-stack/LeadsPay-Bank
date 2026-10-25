import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Radio, X } from 'lucide-react';
import { formatBRL, formatTimestamp, parseBRLToCents } from '../lib/format';
import {
  cancelTapCharge,
  createTapCharge,
  payTapCharge,
  subscribeSellerCharges,
} from '../lib/leadstap';
import type { TapCharge } from '../types';

interface TapViewProps {
  uid: string;
  displayName: string;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}

export const TapView: React.FC<TapViewProps> = ({
  uid,
  displayName,
  onDone,
  onError,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [created, setCreated] = useState<TapCharge | null>(null);
  const [charges, setCharges] = useState<TapCharge[]>([]);
  const [payCode, setPayCode] = useState('');
  const [receipt, setReceipt] = useState<TapCharge | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return subscribeSellerCharges(uid, setCharges);
  }, [uid]);

  const openCharges = charges.filter((c) => c.status === 'open');

  const handleCreate = async () => {
    const cents = parseBRLToCents(amount);
    if (cents === null) {
      onError('Informe um valor válido para a cobrança.');
      return;
    }
    setBusy(true);
    try {
      const charge = await createTapCharge({
        sellerUid: uid,
        sellerName: displayName,
        amountGrossCents: cents,
        description,
      });
      setCreated(charge);
      setAmount('');
      setDescription('');
      onDone('Cobrança criada. Compartilhe o código com o pagador.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha ao criar a cobrança.');
    } finally {
      setBusy(false);
    }
  };

  const handlePay = async () => {
    setBusy(true);
    try {
      const { charge } = await payTapCharge({
        payerUid: uid,
        payerName: displayName,
        code: payCode,
      });
      setReceipt(charge);
      setPayCode('');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00e676', '#a3e635', '#ffffff'],
      });
      onDone('Pagamento confirmado com saldo real.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha no pagamento.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (chargeId: string) => {
    try {
      await cancelTapCharge({ sellerUid: uid, chargeId });
      onDone('Cobrança cancelada.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha ao cancelar.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <Radio className="w-6 h-6 text-[#00e676]" />
        Cobrar com LeadsTap
      </h1>
      <p className="text-sm text-slate-400">
        Cobrança entre contas LeadsTap, paga com saldo real. Não envolve cartão
        nem adquirência: o pagador precisa ter saldo na LeadsTap para pagar.
      </p>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="font-semibold">Criar cobrança</h2>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Valor (ex.: 85,00)"
          className="w-full rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da venda (opcional)"
          className="w-full rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676]"
        />
        <p className="text-xs text-slate-500">
          Taxa única da venda: R$ 0,99, descontada do valor bruto e mostrada no
          recibo. O valor precisa ser maior que a taxa.
        </p>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="w-full rounded-full bg-[#00e676] text-black font-semibold py-3 text-sm disabled:opacity-50"
        >
          {busy ? 'Criando…' : 'Gerar código de cobrança'}
        </button>
        {created && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center">
            <p className="text-xs text-slate-400">Código para o pagador digitar</p>
            <p className="font-mono-numbers text-3xl font-bold tracking-[0.2em] text-[#00e676] mt-1">
              {created.code}
            </p>
            <p className="text-sm text-slate-300 mt-2">
              Bruto {formatBRL(created.amountGrossCents)} → taxa{' '}
              {formatBRL(created.feeCents)} → você recebe{' '}
              {formatBRL(created.netCents)}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="font-semibold">Pagar uma cobrança</h2>
        <input
          value={payCode}
          onChange={(e) => setPayCode(e.target.value.toUpperCase())}
          placeholder="Código de 6 letras"
          maxLength={6}
          className="w-full rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676] tracking-[0.2em] font-mono-numbers"
        />
        <button
          type="button"
          onClick={handlePay}
          disabled={busy || payCode.length !== 6}
          className="w-full rounded-full border border-white/20 font-semibold py-3 text-sm disabled:opacity-50"
        >
          {busy ? 'Confirmando…' : 'Pagar com meu saldo'}
        </button>
        {receipt && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4">
            <p className="font-semibold text-[#00e676]">Pagamento aprovado</p>
            <p className="text-sm text-slate-300 mt-2">
              Você pagou {formatBRL(receipt.amountGrossCents)} para{' '}
              {receipt.sellerName}.
            </p>
            <p className="text-xs text-slate-500 mt-2 break-all">
              Recibo: {receipt.id}
              {receipt.paidAt ? ` · ${formatTimestamp(receipt.paidAt)}` : ''}
            </p>
          </div>
        )}
      </section>

      {openCharges.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold mb-3">Suas cobranças abertas</h2>
          <ul className="space-y-3">
            {openCharges.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono-numbers font-semibold">{c.code}</p>
                  <p className="text-sm text-slate-400">
                    {formatBRL(c.amountGrossCents)} · {c.description || 'Venda LeadsTap'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancel(c.id)}
                  aria-label="Cancelar cobrança"
                  className="rounded-full border border-white/20 p-2 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
