import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { formatBRL, parseBRLToCents } from '../lib/format';
import {
  registerPixKey,
  removePixKey,
  resolvePixKey,
  sendPixP2P,
} from '../lib/leadstap';
import type { LeadsTapProfile } from '../types';

interface PixViewProps {
  uid: string;
  displayName: string;
  profile: LeadsTapProfile | null;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}

export const PixView: React.FC<PixViewProps> = ({
  uid,
  displayName,
  profile,
  onDone,
  onError,
}) => {
  const [key, setKey] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [newKey, setNewKey] = useState('');
  const [busy, setBusy] = useState(false);

  const handleResolve = async () => {
    if (!key.trim()) {
      onError('Informe a chave Pix do destinatário.');
      return;
    }
    setResolving(true);
    try {
      const record = await resolvePixKey(key);
      if (!record) {
        setResolvedName(null);
        onError('Chave não encontrada na LeadsTap.');
        return;
      }
      if (record.uid === uid) {
        setResolvedName(null);
        onError('Essa chave é a sua própria conta.');
        return;
      }
      setResolvedName(record.ownerName);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha ao buscar a chave.');
    } finally {
      setResolving(false);
    }
  };

  const handleSend = async () => {
    const cents = parseBRLToCents(amount);
    if (cents === null) {
      onError('Informe um valor válido.');
      return;
    }
    if (!resolvedName) {
      onError('Confirme o destinatário antes de enviar.');
      return;
    }
    setBusy(true);
    try {
      const { recipientName } = await sendPixP2P({
        senderUid: uid,
        senderName: displayName,
        key,
        amountCents: cents,
        description,
      });
      setAmount('');
      setDescription('');
      setKey('');
      setResolvedName(null);
      onDone(`Pix de ${formatBRL(cents)} enviado para ${recipientName} — taxa zero.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha no envio.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!newKey.trim()) return;
    setBusy(true);
    try {
      await registerPixKey({ uid, ownerName: displayName, key: newKey });
      setNewKey('');
      onDone('Chave Pix registrada na sua conta.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha ao registrar a chave.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (k: string) => {
    setBusy(true);
    try {
      await removePixKey({ uid, key: k });
      onDone('Chave Pix removida.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Falha ao remover a chave.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <QrCode className="w-6 h-6 text-[#00e676]" />
        Pix
      </h1>
      <p className="text-sm text-slate-400">
        Pix entre usuários LeadsTap, com taxa zero, pago com saldo real. Pix para
        outros bancos ainda não tem trilho parceiro — veja abaixo.
      </p>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="font-semibold">Enviar Pix para outro usuário LeadsTap</h2>
        <div className="flex gap-2">
          <input
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setResolvedName(null);
            }}
            placeholder="Chave Pix do destinatário"
            className="flex-1 min-w-0 rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676]"
          />
          <button
            type="button"
            onClick={handleResolve}
            disabled={resolving}
            className="rounded-full border border-white/20 px-4 text-sm font-semibold disabled:opacity-50"
          >
            {resolving ? 'Buscando…' : 'Confirmar'}
          </button>
        </div>
        {resolvedName && (
          <p className="text-sm text-[#00e676]">
            Destinatário: <span className="font-semibold">{resolvedName}</span>
          </p>
        )}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Valor (ex.: 5,00)"
          className="w-full rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className="w-full rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676]"
        />
        <p className="text-xs text-slate-500">Taxa: R$ 0,00.</p>
        <button
          type="button"
          onClick={handleSend}
          disabled={busy || !resolvedName}
          className="w-full rounded-full bg-[#00e676] text-black font-semibold py-3 text-sm disabled:opacity-50"
        >
          {busy ? 'Enviando…' : 'Enviar Pix'}
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="font-semibold">Minhas chaves Pix</h2>
        {profile && profile.pixKeys.length > 0 ? (
          <ul className="space-y-2">
            {profile.pixKeys.map((k) => (
              <li key={k} className="flex items-center justify-between gap-3">
                <span className="text-sm break-all">{k}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(k)}
                  disabled={busy}
                  className="text-sm text-red-300 disabled:opacity-50 shrink-0"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Nenhuma chave registrada. Registre uma chave para receber Pix de outros
            usuários LeadsTap.
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Nova chave (e-mail, telefone…)"
            className="flex-1 min-w-0 rounded-2xl bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-[#00e676]"
          />
          <button
            type="button"
            onClick={handleRegister}
            disabled={busy}
            className="rounded-full border border-white/20 px-4 text-sm font-semibold disabled:opacity-50"
          >
            Registrar
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-5">
        <h2 className="font-semibold text-slate-300">Pix para outros bancos — indisponível</h2>
        <p className="text-sm text-slate-400 mt-2">
          Enviar Pix para contas fora da LeadsTap ainda não tem trilho parceiro
          assinado. Por isso o botão não existe aqui: nenhum valor é movimentado
          para fora até o trilho existir. Pix entre usuários LeadsTap já funciona.
        </p>
      </section>
    </div>
  );
};
