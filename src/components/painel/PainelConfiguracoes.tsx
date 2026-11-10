import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  FileText,
  KeyRound,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  SunMoon,
  User,
  Users,
} from 'lucide-react';
import { EmptyState, SPRING, WhiteCard } from '../ui';
import type { PainelProps, ThemePref } from './types';
import type { AccountApplication } from '../../types';
import { getServerApplication } from '../../services/firebaseBankService';

type Tab = 'conta' | 'maquininhas' | 'equipe' | 'seguranca' | 'informes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'conta', label: 'Sua conta' },
  { id: 'maquininhas', label: 'Suas Maquininhas' },
  { id: 'equipe', label: 'Sua equipe' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'informes', label: 'Seus informes' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  needs_revision: 'Em revisão',
  rejected: 'Reprovada',
};

/** Lê a preferência salva (fallback local; o App é o dono do estado). */
function readThemePref(): ThemePref {
  try {
    const saved = localStorage.getItem('leadstap-theme');
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(pref: ThemePref): void {
  const root = document.querySelector('[data-theme]');
  if (!root) return;
  const effective =
    pref === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : pref;
  root.setAttribute('data-theme', effective);
}

/**
 * Documento mascarado, sem nunca exibir o valor plantado.
 * 11 dígitos → CPF; 14 → CNPJ; vazio ou plantado → null (linha some).
 */
function maskDocument(document: string | undefined): { label: string; value: string } | null {
  if (!document) return null;
  if (document.includes('***')) return null;
  const digits = document.replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length === 11) {
    return { label: 'CPF', value: `${digits.slice(0, 3)}.***.***-${digits.slice(9)}` };
  }
  if (digits.length === 14) {
    return { label: 'CNPJ', value: `${digits.slice(0, 2)}.***.***/****-${digits.slice(12)}` };
  }
  return {
    label: 'Documento',
    value: `${digits.slice(0, 3)}${'•'.repeat(Math.max(0, digits.length - 5))}${digits.slice(-2)}`,
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--shell-border)] py-3 text-[14px] last:border-0">
      <span className="text-[var(--shell-muted)]">{label}</span>
      <span className="text-right font-semibold break-all">{value}</span>
    </div>
  );
}

/**
 * U22 — Configurações (v3.1 §8-U22 + v3.2 §D5.4, §D7.1, §D7.4, §D7.5).
 * 5 abas dentro desta view (Maquininhas/Equipe/Informes são abas, não
 * rotas nem arquivos próprios). "Sua conta" mostra SÓ o que existe:
 * sem telefone por padrão, sem tag/nível/dispositivo/CNAE/código de
 * banco. Segurança abre o SecurityCenterModal existente.
 *
 * Tema: o App é o dono do estado (`themePref`/`onThemePrefChange`
 * chegam por props via Shell). O fallback local (localStorage +
 * data-theme direto) só vale se as props não vierem — nunca há dois
 * escritores do tema ao mesmo tempo.
 */
export const PainelConfiguracoes: React.FC<PainelProps> = ({
  userProfile,
  navigate,
  onOpenSecurity,
  themePref: themePrefProp,
  onThemePrefChange,
}) => {
  const [tab, setTab] = useState<Tab>('conta');
  const [localPref, setLocalPref] = useState<ThemePref>(readThemePref);
  const themePref = themePrefProp ?? localPref;
  const [copied, setCopied] = useState(false);
  const [application, setApplication] = useState<AccountApplication | null>(null);

  useEffect(() => {
    // Fallback local: só quando o App não repassa as props de tema.
    if (themePrefProp) return;
    applyTheme(localPref);
    if (localPref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [localPref, themePrefProp]);

  // Telefone e representante legal só existem na proposta aprovada (§D7.4).
  useEffect(() => {
    const uid = userProfile.uid;
    if (!uid) return;
    let alive = true;
    getServerApplication(uid)
      .then((app) => {
        if (alive) setApplication(app);
      })
      .catch(() => {
        if (alive) setApplication(null);
      });
    return () => {
      alive = false;
    };
  }, [userProfile.uid]);

  const changeTheme = (pref: ThemePref) => {
    if (onThemePrefChange) {
      onThemePrefChange(pref);
      return;
    }
    try {
      localStorage.setItem('leadstap-theme', pref);
    } catch {
      // Sem acesso ao armazenamento: o tema vale só nesta tela.
    }
    setLocalPref(pref);
  };

  const copyBankData = async () => {
    const text = `Agência: ${userProfile.agency || '—'}\nConta: ${userProfile.accountNumber || '—'}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Sem acesso à área de transferência: os dados continuam visíveis.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const doc = maskDocument(userProfile.document);
  const phone = application?.phone?.trim() || null;
  const legalRep = application?.fullName?.trim() || null;
  const situation = userProfile.status
    ? STATUS_LABEL[userProfile.status] || '—'
    : // Contas legadas sem carimbo de status são tratadas como aprovadas
      // (mesma regra do gate do Shell).
      'Aprovada';
  const initial = (userProfile.name || 'L').trim().charAt(0).toUpperCase();

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  return (
    <div>
      <motion.div {...stagger(0)}>
        <h1 className="text-[24px] font-bold tracking-[-0.02em]">Configurações</h1>
      </motion.div>

      <motion.div
        {...stagger(1)}
        className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-[var(--shell-surface-2)] p-1"
        role="tablist"
        aria-label="Configurações"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold whitespace-nowrap ${
              tab === t.id
                ? 'bg-[var(--shell-black)] text-[var(--shell-on-black)]'
                : 'text-[var(--shell-muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {tab === 'conta' && (
        <div className="mt-4 space-y-4">
          <motion.div {...stagger(2)}>
            <WhiteCard>
              <div className="flex items-center gap-4">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--shell-lima)] text-[22px] font-bold text-zinc-950">
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold">{userProfile.name || '—'}</p>
                  <p className="truncate text-[14px] text-[var(--shell-muted)]">
                    {userProfile.email || '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ name: 'conta' }, { pixDrawerOpen: true })}
                className="mt-4 flex w-full items-center justify-between rounded-[16px] bg-[var(--shell-surface-2)] px-4 py-3 text-left text-[15px] font-semibold"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" /> Chave Pix
                </span>
                <ChevronRight className="w-5 h-5 text-[var(--shell-muted)]" />
              </button>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(3)}>
            <WhiteCard>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[15px] font-semibold">
                  <Bell className="w-5 h-5" /> Ative as notificações
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={false}
                  aria-label="Ative as notificações (indisponível)"
                  disabled
                  title="Notificações ainda não existem na LeadsTap."
                  className="relative h-7 w-12 shrink-0 rounded-full bg-[#E5E5E5]"
                >
                  <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow" />
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--shell-muted)]">
                Notificações ainda não existem na LeadsTap.
              </p>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(4)}>
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold">
                <User className="w-5 h-5" /> Seus dados
              </h2>
              <div className="mt-1">
                <Row label="E-mail" value={userProfile.email || '—'} />
                {doc && <Row label={doc.label} value={doc.value} />}
                <Row label="Conta" value={userProfile.accountNumber || '—'} />
                {phone && <Row label="Telefone" value={phone} />}
              </div>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(5)}>
            <WhiteCard>
              <h2 className="text-[16px] font-bold">Dados do negócio</h2>
              <div className="mt-1">
                <Row label="Situação" value={situation} />
                {legalRep && <Row label="Representante legal" value={legalRep} />}
              </div>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(6)}>
            <WhiteCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold">Dados bancários</h2>
                <button
                  type="button"
                  onClick={copyBankData}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--shell-surface-2)] px-3 py-2 text-[13px] font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar dados
                    </>
                  )}
                </button>
              </div>
              <div className="mt-1">
                <Row label="Agência" value={userProfile.agency || '—'} />
                <Row label="Conta" value={userProfile.accountNumber || '—'} />
              </div>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(7)}>
            <WhiteCard>
              <h2 className="text-[16px] font-bold">Tema</h2>
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
                {(
                  [
                    ['light', 'Claro', Sun],
                    ['dark', 'Escuro', Moon],
                    ['system', 'Inteligente', SunMoon],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={themePref === value}
                    onClick={() => changeTheme(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-[16px] border px-2 py-3 text-[14px] font-semibold ${
                      themePref === value
                        ? 'border-[var(--shell-text)] bg-[var(--shell-surface-2)]'
                        : 'border-[var(--shell-border)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
                Inteligente segue o tema do seu aparelho.
              </p>
            </WhiteCard>
          </motion.div>
        </div>
      )}

      {tab === 'maquininhas' && (
        <motion.div {...stagger(2)} className="mt-4">
          <WhiteCard>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--shell-surface-2)]">
                <Smartphone className="w-7 h-7" />
              </span>
              <h2 className="text-[16px] font-bold">Suas Maquininhas</h2>
            </div>
            <div className="mt-4">
              <EmptyState
                title="Você ainda não tem maquininhas."
                text="A LeadsTap não vende maquininhas — a cobrança é pelo celular (Tap)."
              />
            </div>
          </WhiteCard>
        </motion.div>
      )}

      {tab === 'equipe' && (
        <motion.div {...stagger(2)} className="mt-4">
          <WhiteCard>
            <h2 className="flex items-center gap-2 text-[16px] font-bold">
              <Users className="w-5 h-5" /> Sua equipe
            </h2>
            <p className="mt-2 text-[14px] text-[var(--shell-muted)]">
              Os papéis abaixo ainda não estão ativos.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-[var(--shell-surface-2)] p-4">
                <p className="text-[15px] font-bold">Contador</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--shell-muted)]">
                  Acompanha vendas, extrato e recebimentos e recebe relatórios
                  mensais. Não faz transações de saída.
                </p>
                <button
                  type="button"
                  disabled
                  title="Gestão de equipe ainda não disponível."
                  className="mt-3 rounded-full bg-[#E5E5E5] px-4 py-2 text-[13px] font-semibold text-[#9CA3AF]"
                >
                  Convidar — Em breve
                </button>
              </div>
              <div className="rounded-[16px] bg-[var(--shell-surface-2)] p-4">
                <p className="text-[15px] font-bold">Vendedor</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--shell-muted)]">
                  Vende com o Tap e com links de pagamento e recebe com Pix. Não vê o
                  saldo nem gerencia a equipe.
                </p>
                <button
                  type="button"
                  disabled
                  title="Gestão de equipe ainda não disponível."
                  className="mt-3 rounded-full bg-[#E5E5E5] px-4 py-2 text-[13px] font-semibold text-[#9CA3AF]"
                >
                  Convidar — Em breve
                </button>
              </div>
            </div>
            <button
              type="button"
              disabled
              title="Gestão de equipe ainda não disponível."
              className="mt-4 rounded-full bg-[#E5E5E5] px-5 py-3 text-[14px] font-semibold text-[#9CA3AF]"
            >
              Adicionar
            </button>
          </WhiteCard>
        </motion.div>
      )}

      {tab === 'seguranca' && (
        <motion.div {...stagger(2)} className="mt-4">
          <WhiteCard>
            <h2 className="flex items-center gap-2 text-[16px] font-bold">
              <ShieldCheck className="w-5 h-5" /> Segurança
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--shell-muted)]">
              A Central de Segurança abre em uma janela própria, com a senha do app,
              o token e a biometria.
            </p>
            <button
              type="button"
              onClick={onOpenSecurity}
              className="mt-4 rounded-full bg-[var(--shell-black)] px-5 py-3 text-[14px] font-semibold text-[var(--shell-on-black)]"
            >
              Abrir Central de Segurança
            </button>
          </WhiteCard>
        </motion.div>
      )}

      {tab === 'informes' && (
        <motion.div {...stagger(2)} className="mt-4">
          <WhiteCard>
            <h2 className="flex items-center gap-2 text-[16px] font-bold">
              <FileText className="w-5 h-5" /> Seus informes
            </h2>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[16px] bg-[var(--shell-surface-2)] px-4 py-3.5">
              <span className="text-[15px] font-semibold">DIRF</span>
              <button
                type="button"
                disabled
                title="Informes ainda não disponíveis — nenhum informe foi gerado."
                className="rounded-full bg-[#E5E5E5] px-4 py-2 text-[13px] font-semibold text-[#9CA3AF]"
              >
                Baixar
              </button>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--shell-muted)]">
              Informes ainda não disponíveis — nenhum informe foi gerado.
            </p>
          </WhiteCard>
        </motion.div>
      )}
    </div>
  );
};
