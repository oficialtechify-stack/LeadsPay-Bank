import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  CreditCard,
  PieChart,
  Code2,
  ChevronRight,
  Sparkles,
  Barcode,
  ShieldCheck,
  Key,
  QrCode,
  Sliders,
} from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { getLocalLoginBanners } from '../services/firebaseBankService';
import { ActionTile, Card, SectionTitle, WhiteCard } from './ui';

interface DashboardViewProps {
  userProfile: UserProfile;
  showBalance: boolean;
  transactions: Transaction[];
  onOpenPix: () => void;
  onOpenPixReceive: () => void;
  onOpenPixKeys: () => void;
  onOpenPixLimits: () => void;
  onOpenTapToPay: () => void;
  onOpenCards: () => void;
  onOpenExtrato: () => void;
  onOpenFinance: () => void;
  onOpenDevApi: () => void;
  onOpenSecurity: () => void;
  /** Acesso novo (§4.1, DET-3): o Token só abria pela login; aqui entra em "Mais ações". */
  onOpenToken: () => void;
  onOpenAdminReview?: () => void;
  isAdmin: boolean;
}

const PIX_KEY_LABEL: Record<string, string> = {
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Celular',
  random: 'Chave aleatória',
};

/**
 * Aba Conta (§4.1 do plano v2) — compõe sobre o DashboardView.
 * Hero claro SEM "Rendimento 105% CDI" e SEM a pill de investedBalance
 * (§7.10); grade de 6 ações com os mesmos destinos; banners do login
 * reaproveitados como estão (Q14=(A) — só imagens, sem selo por imagem);
 * "Sua conta" lendo do estado; "Mais ações" com Token (acesso novo);
 * últimas 5 movimentações ligando para o Extrato.
 *
 * PENDENTE (passo 10, §7.7): as chaves Pix exibidas em "Sua conta" ainda
 * são as semeadas do caminho Google — NÃO há filtro provisório aqui que
 * esconda dado; a correção é do passo 10.
 */
export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  showBalance,
  transactions,
  onOpenPix,
  onOpenPixReceive,
  onOpenPixKeys,
  onOpenPixLimits,
  onOpenTapToPay,
  onOpenCards,
  onOpenExtrato,
  onOpenFinance,
  onOpenDevApi,
  onOpenSecurity,
  onOpenToken,
  onOpenAdminReview,
  isAdmin,
}) => {
  const recentTransactions = transactions.slice(0, 5);
  // Guarantee that only real available positive balance is displayed in current account
  const currentAccountBalance = Math.max(0, userProfile.balance || 0);
  // Banners do login reaproveitados como estão (Q14=(A)): só imagens.
  const banners = getLocalLoginBanners();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Hero de saldo — claro, sem promessa de rendimento e sem pill de investimentos */}
      <WhiteCard>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            Saldo em Conta Corrente
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight font-mono-numbers my-1">
          {showBalance ? (
            <>
              <span className="text-xl sm:text-2xl font-normal text-zinc-500 mr-1.5">R$</span>
              {currentAccountBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </>
          ) : (
            <span className="tracking-widest text-zinc-400 text-2xl font-mono">••••••••</span>
          )}
        </div>

        {/* Linha de ação rápida do Pix (mesma ação dos tiles, sem duplicar destino) */}
        <div className="mt-5 pt-4 border-t border-black/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPix}
              className="text-zinc-950 hover:text-zinc-500 flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Enviar Pix</span>
            </button>
            <button
              onClick={onOpenPixReceive}
              className="text-zinc-500 hover:text-zinc-950 flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#00e676]" />
              <span>Receber Pix</span>
            </button>
          </div>

          <button
            onClick={onOpenExtrato}
            className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
          >
            <span>Ver extrato</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </WhiteCard>

      {/* Grade de ações — os 6 destinos do Bank, só o visual muda */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Serviços Principais
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ActionTile Icon={Sparkles} label="Área Pix" tone="green" onClick={onOpenPix} />
          <ActionTile Icon={Smartphone} label="Cobrar com Tap" tone="dark" onClick={onOpenTapToPay} />
          <ActionTile Icon={CreditCard} label="Cartões" tone="blue" onClick={onOpenCards} />
          <ActionTile Icon={Barcode} label="Extrato" tone="violet" onClick={onOpenExtrato} />
          <ActionTile Icon={PieChart} label="Gestão" tone="amber" onClick={onOpenFinance} />
          <ActionTile Icon={Code2} label="Dev API" tone="dark" onClick={onOpenDevApi} />
        </div>
      </div>

      {/* Banners — carrossel com as imagens do login, como estão (Q14=(A)) */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {banners.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-[85%] sm:w-[60%] shrink-0 rounded-[24px] aspect-[16/9] object-cover"
          />
        ))}
      </div>

      {/* Sua conta — dados reais do perfil, lendo do estado */}
      <div>
        <SectionTitle>Sua conta</SectionTitle>
        <WhiteCard className="mt-3 !p-0 overflow-hidden divide-y divide-black/[0.06]">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[15px] font-semibold">Agência e conta</p>
              <p className="text-sm text-zinc-500 mt-0.5 font-mono">
                Ag {userProfile.agency} · Conta {userProfile.accountNumber}
              </p>
            </div>
            <span className="text-sm text-zinc-500">{userProfile.bankCode}</span>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Chaves Pix</p>
              <button
                type="button"
                onClick={onOpenPixKeys}
                className="rounded-full bg-[#f4f4f5] px-4 py-2 text-sm font-semibold text-zinc-900"
              >
                Gerenciar
              </button>
            </div>
            {userProfile.pixKeys.length === 0 ? (
              <p className="text-sm text-zinc-500 mt-2">Nenhuma chave cadastrada.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {userProfile.pixKeys.map((k, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-500 shrink-0">{PIX_KEY_LABEL[k.type] || k.type}</span>
                    <span className="font-mono text-zinc-900 truncate">{k.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Limites Pix</p>
              <button
                type="button"
                onClick={onOpenPixLimits}
                className="rounded-full bg-[#f4f4f5] px-4 py-2 text-sm font-semibold text-zinc-900"
              >
                Ajustar
              </button>
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Diário (06h às 20h)</span>
                <span className="font-mono font-semibold text-zinc-900">
                  R$ {userProfile.dailyPixLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Noturno (20h às 06h)</span>
                <span className="font-mono font-semibold text-zinc-900">
                  R$ {userProfile.nightlyPixLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
        </WhiteCard>
      </div>

      {/* Mais ações — Segurança, Suporte, Token (acesso novo) e Admin KYC (só admin) */}
      <div>
        <SectionTitle>Mais ações</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <ActionTile Icon={ShieldCheck} label="Segurança" tone="dark" onClick={onOpenSecurity} />
          <ActionTile Icon={Key} label="Token" tone="green" onClick={onOpenToken} />
          {isAdmin && onOpenAdminReview && (
            <ActionTile Icon={Sparkles} label="Admin KYC" tone="amber" onClick={onOpenAdminReview} />
          )}
        </div>
      </div>

      {/* Últimas movimentações */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Últimas Movimentações</h3>
          <button
            onClick={onOpenExtrato}
            className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Ver extrato completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 mt-3">
          {recentTransactions.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-3 rounded-2xl bg-white border border-dashed border-black/10">
              <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 text-[#00a854] flex items-center justify-center mx-auto">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-950">Nenhuma movimentação registrada</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Receba vendas via LeadsTap por aproximação ou envie/receba um Pix.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onOpenTapToPay}
                  className="px-3 py-1.5 rounded-lg bg-[#00e676]/15 hover:bg-[#00e676]/25 text-[#00a854] text-xs font-medium border border-[#00e676]/30 transition-colors"
                >
                  Cobrar com LeadsTap
                </button>
                <button
                  onClick={onOpenPix}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium border border-black/10 transition-colors"
                >
                  Área Pix
                </button>
              </div>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={onOpenExtrato}
                  className="w-full p-3 rounded-2xl bg-white hover:bg-zinc-50 border border-transparent hover:border-black/[0.06] transition-all flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      tx.type === 'tap_to_pay'
                        ? 'bg-[#00e676]/15 border-[#00e676]/30 text-[#00a854]'
                        : isPositive
                          ? 'bg-[#00e676]/10 border-[#00e676]/20 text-[#00a854]'
                          : 'bg-zinc-100 border-black/[0.06] text-zinc-500'
                    }`}>
                      {tx.type === 'tap_to_pay' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-950 block truncate">
                        {tx.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 block truncate">
                        {tx.recipientOrSender || tx.description}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-bold font-mono-numbers ${
                      isPositive ? 'text-[#00a854]' : 'text-zinc-950'
                    }`}>
                      {isPositive ? '+' : ''}R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      {tx.dateFormatted}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>
    </motion.div>
  );
};
