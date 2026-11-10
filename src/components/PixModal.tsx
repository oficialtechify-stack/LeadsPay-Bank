import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowUpRight, 
  QrCode, 
  Key, 
  Sliders, 
  Copy, 
  Check, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  User, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/audio';
import { Transaction, UserProfile } from '../types';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onNewTransaction: (tx: Transaction) => void;
  onRequestBiometric: (actionName: string, onVerified: () => void) => void;
  /** Q13=(A): persiste dailyPixLimit/nightlyPixLimit de verdade (App.tsx). */
  onSavePixLimits?: (daily: number, nightly: number) => void;
  /** Aba aberta ao abrir o modal (padrão: 'send'). O QR do header abre 'receive'. */
  initialTab?: 'send' | 'receive' | 'keys' | 'limits';
}

export const PixModal: React.FC<PixModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onNewTransaction,
  onRequestBiometric,
  onSavePixLimits,
  initialTab = 'send'
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'keys' | 'limits'>('send');

  // Ao abrir, honrar a aba pedida pelo chamador (ex.: QR do header → Receber).
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Q13: os sliders sempre abrem com os limites persistidos do perfil
      // (nunca com valores de uma edição anterior descartada).
      setDailyLimit(userProfile.dailyPixLimit);
      setNightlyLimit(userProfile.nightlyPixLimit);
      setLimitsSaved(false);
    }
  }, [isOpen, initialTab]);
  
  // Transfer State
  const [pixKey, setPixKey] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [description, setDescription] = useState('');
  const [sendStep, setSendStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [copiedKey, setCopiedKey] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Receive State — §7.4: abre VAZIO (nada de '150.00' como valor).
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveKeyType, setReceiveKeyType] = useState('cpf');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Limits State
  const [dailyLimit, setDailyLimit] = useState(userProfile.dailyPixLimit);
  const [nightlyLimit, setNightlyLimit] = useState(userProfile.nightlyPixLimit);
  const [limitsSaved, setLimitsSaved] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableBalance = Math.max(0, userProfile.balance || 0);

  // Handle Send Confirmation
  const handleProceedConfirm = () => {
    setSendError(null);
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
      setSendError('Informe um valor de Pix válido maior que zero.');
      return;
    }
    if (!pixKey.trim()) {
      setSendError('Por favor, informe a chave Pix do destinatário.');
      return;
    }
    if (amount > availableBalance) {
      setSendError(
        `Saldo insuficiente. Seu saldo disponível é de R$ ${availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Não é possível enviar um Pix maior do que o saldo em conta.`
      );
      return;
    }

    // §7.3: sem nome digitado, sem nome exibido — mostrar a chave Pix,
    // nunca um nome inventado.
    const detectedName = recipientName.trim();
    setRecipientName(detectedName);
    setSendStep('confirm');
  };

  const handleExecuteSend = () => {
    onRequestBiometric('Confirmar envio Pix de R$ ' + amountStr, () => {
      soundEffects.playPixSuccess();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e676', '#a3e635', '#ffffff']
      });

      const numAmount = parseFloat(amountStr);
      const now = new Date();
      const e2e = 'E592' + Date.now() + 'PIX8890';

      const tx: Transaction = {
        id: 'tx-pix-' + Date.now(),
        type: 'pix_out',
        title: 'Pix Enviado',
        description: description.trim() || (recipientName ? `Transferência para ${recipientName}` : 'Transferência Pix'),
        amount: -numAmount,
        timestamp: now.toISOString(),
        dateFormatted: 'Hoje às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category: 'Transferência',
        status: 'completed',
        // §7.3: sem nome, o destinatário exibido é a chave Pix informada.
        recipientOrSender: recipientName || pixKey,
        e2eId: e2e,
        authMethod: 'Biometria (Face ID)'
      };

      onNewTransaction(tx);
      setCompletedTx(tx);
      setSendStep('success');
    });
  };

  const resetSend = () => {
    setPixKey('');
    setAmountStr('');
    setRecipientName('');
    setDescription('');
    setSendStep('input');
    setCompletedTx(null);
  };

  // §7.7: sem chave cadastrada, sem e-mail inventado no payload.
  const pixPayloadMock = `00020126580014br.gov.bcb.pix0136${userProfile.pixKeys[0]?.value || ''}520400005303986540${(parseFloat(receiveAmount) || 0).toFixed(2)}5802BR5913LEADSPAY BANK6009SAO PAULO62070503***6304`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.15)] text-zinc-950 flex flex-col max-h-[92vh]"
      >
        {/* Top bar */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00a854]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 flex items-center gap-1.5">
                <span>Área Pix Instantâneo</span>
                <span className="text-[10px] bg-[#00e676]/15 text-[#00a854] px-1.5 py-0.5 rounded font-mono font-semibold">
                  24/7 Líquido
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Envie e receba em segundos sem taxas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-4 p-1 bg-[#f4f4f5] border border-black/[0.06] rounded-xl">
            <button
              onClick={() => { setActiveTab('send'); resetSend(); }}
              className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'send'
                  ? 'bg-zinc-950 text-white border border-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'receive'
                  ? 'bg-zinc-950 text-white border border-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Receber</span>
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'keys'
                  ? 'bg-zinc-950 text-white border border-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Chaves</span>
            </button>
            <button
              onClick={() => setActiveTab('limits')}
              className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'limits'
                  ? 'bg-zinc-950 text-white border border-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Limites</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          {/* TAB 1: SEND PIX */}
          {activeTab === 'send' && (
            <div>
              {sendStep === 'input' && (
                <div className="space-y-4">
                  {/* Amount Input */}
                  <div className="bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-4 text-center">
                    <label className="text-xs text-zinc-500 font-medium block mb-1">
                      Quanto você quer transferir?
                    </label>
                    <div className="flex items-center justify-center gap-1 text-3xl font-extrabold text-zinc-950">
                      <span className="text-[#00a854] text-xl font-normal">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        className="bg-transparent text-center font-mono-numbers outline-none max-w-[220px] border-b border-emerald-500/50 pb-1"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Saldo disponível: <strong className="text-[#00a854] font-mono">R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  {sendError && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{sendError}</span>
                    </div>
                  )}

                  {/* Quick Value Chips */}
                  <div className="flex items-center justify-center gap-2">
                    {[50, 100, 250, 500, 1000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmountStr(v.toFixed(2))}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#00e676]/15 text-zinc-600 hover:text-[#00a854] text-xs font-mono border border-black/[0.06] transition-all"
                      >
                        R${v}
                      </button>
                    ))}
                  </div>

                  {/* Pix Key input */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-700 font-medium">Chave Pix ou Código Copia e Cola</label>
                    <input
                      type="text"
                      placeholder="CPF, CNPJ, E-mail, Celular ou chave aleatória"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-black/[0.06] rounded-xl text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-colors"
                    />
                  </div>

                  {/* Optional Recipient or Description */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-500">Nome do destinatário (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos M."
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-black/[0.06] rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-500">Descrição no extrato</label>
                      <input
                        type="text"
                        placeholder="Ex: Pagamento serviço"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-black/[0.06] rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleProceedConfirm}
                    disabled={!amountStr || parseFloat(amountStr) <= 0 || !pixKey.trim()}
                    className="w-full py-3.5 bg-[#00e676] hover:bg-[#00c853] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,230,118,0.4)] active:scale-[0.99] mt-2"
                  >
                    <span>Revisar e Continuar</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              )}

              {/* STEP 2: CONFIRMATION */}
              {sendStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#f4f4f5] border border-[#00e676]/30 text-center">
                    <span className="text-xs text-zinc-500">Valor a transferir</span>
                    <div className="text-3xl font-black text-zinc-950 mt-0.5">
                      R$ {parseFloat(amountStr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00e676]/15 border border-[#00e676]/30 text-[#00a854] text-xs font-medium mt-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" />
                      <span>Sem tarifas · Liquidação Imediata</span>
                    </div>
                  </div>

                  {/* Destination breakdown */}
                  <div className="bg-white border border-black/[0.06] rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                      <span className="text-zinc-500">Destinatário</span>
                      <span className="font-semibold text-zinc-950">{recipientName || pixKey}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Chave informada</span>
                      <span className="font-mono text-zinc-800">{pixKey}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Instituição</span>
                      <span className="text-zinc-800">Banco Central do Brasil / Pix SPI</span>
                    </div>
                    {description && (
                      <div className="flex items-center justify-between pt-1 border-t border-black/[0.06]">
                        <span className="text-zinc-500">Mensagem</span>
                        <span className="text-zinc-600 italic">"{description}"</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleExecuteSend}
                      className="w-full py-3.5 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,230,118,0.4)] active:scale-[0.99]"
                    >
                      <ShieldCheck className="w-4 h-4 text-black" />
                      <span>Confirmar com Biometria</span>
                    </button>
                    <button
                      onClick={() => setSendStep('input')}
                      className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-950 transition-colors"
                    >
                      Voltar e corrigir dados
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS */}
              {sendStep === 'success' && completedTx && (
                <div className="text-center py-2 space-y-4">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-[#00e676] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,230,118,0.4)]"
                  >
                    <CheckCircle2 className="w-10 h-10 text-[#00e676]" />
                  </motion.div>

                  <div>
                    <span className="text-xs text-zinc-500">Transferência Pix Realizada!</span>
                    <div className="text-3xl font-black text-zinc-950 mt-1">
                      R$ {Math.abs(completedTx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-[#00a854] mt-0.5">
                      Enviado com sucesso para {completedTx.recipientOrSender}
                    </p>
                  </div>

                  {/* Receipt Box */}
                  <div className="bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-4 text-left text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-black/[0.06]">
                      <span className="text-zinc-500">ID Fim a Fim (E2E)</span>
                      <span className="font-mono text-[10px] text-zinc-600 truncate max-w-[200px]">
                        {completedTx.e2eId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Autenticação</span>
                      <span className="text-[#00a854] font-semibold">{completedTx.authMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Data e Hora</span>
                      <span className="text-zinc-800">{completedTx.dateFormatted}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => alert('Comprovante oficial Pix copiado!')}
                      className="py-2.5 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-black/10"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>
                    <button
                      onClick={() => {
                        resetSend();
                        onClose();
                      }}
                      className="py-2.5 bg-[#00e676] hover:bg-[#00c853] text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
                    >
                      <span>Concluir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECEIVE PIX */}
          {activeTab === 'receive' && (
            <div className="space-y-4 text-center">
              <div>
                <span className="text-xs text-zinc-500">Valor a receber (opcional)</span>
                <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-zinc-950 mt-1">
                  <span className="text-[#00a854] text-lg">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    className="bg-transparent text-center font-mono-numbers outline-none max-w-[150px] border-b border-emerald-500/50 pb-0.5"
                  />
                </div>
              </div>

              {/* Dynamic QR Code Vector Graphic */}
              <div className="p-4 bg-white rounded-2xl max-w-[200px] mx-auto shadow-xl border border-black/[0.06] flex flex-col items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-36 h-36">
                  {/* Outer QR Code Finder Patterns */}
                  <rect x="10" y="10" width="40" height="40" fill="#000" rx="4" />
                  <rect x="16" y="16" width="28" height="28" fill="#fff" rx="2" />
                  <rect x="22" y="22" width="16" height="16" fill="#000" rx="1" />

                  <rect x="110" y="10" width="40" height="40" fill="#000" rx="4" />
                  <rect x="116" y="16" width="28" height="28" fill="#fff" rx="2" />
                  <rect x="122" y="22" width="16" height="16" fill="#000" rx="1" />

                  <rect x="10" y="110" width="40" height="40" fill="#000" rx="4" />
                  <rect x="16" y="116" width="28" height="28" fill="#fff" rx="2" />
                  <rect x="22" y="122" width="16" height="16" fill="#000" rx="1" />

                  {/* QR Matrix Dots */}
                  <rect x="60" y="20" width="8" height="8" fill="#000" />
                  <rect x="75" y="15" width="10" height="10" fill="#000" />
                  <rect x="90" y="25" width="8" height="8" fill="#000" />
                  <rect x="20" y="65" width="12" height="8" fill="#000" />
                  <rect x="38" y="70" width="8" height="12" fill="#000" />
                  <rect x="60" y="60" width="40" height="40" fill="#00e676" rx="6" />
                  <text x="80" y="85" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">LP</text>
                  <rect x="110" y="65" width="8" height="8" fill="#000" />
                  <rect x="130" y="75" width="10" height="10" fill="#000" />
                  <rect x="60" y="120" width="12" height="12" fill="#000" />
                  <rect x="85" y="115" width="10" height="10" fill="#000" />
                  <rect x="115" y="120" width="25" height="10" fill="#000" />
                </svg>
                <span className="text-[10px] font-bold text-slate-800 tracking-wider mt-1 uppercase">
                  LeadsPay Pix SPI
                </span>
              </div>

              {/* Pix Copia e Cola Payload box */}
              <div className="bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-3 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Código Pix Copia e Cola</span>
                    {/* Q11=(B): o payload é montado à mão e não é um QR válido —
                        marcado como demonstração; pagamento real com ele falha. */}
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      demonstração
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixPayloadMock);
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }}
                    className="text-xs text-[#00a854] hover:text-zinc-950 flex items-center gap-1"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="font-mono text-[10px] text-zinc-600 break-all bg-white p-2 rounded-lg border border-black/[0.06]">
                  {pixPayloadMock}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => alert('Link de cobrança Pix copiado!')}
                  className="py-2.5 px-4 bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-black/[0.06]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar QR Code</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MY PIX KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Suas chaves cadastradas</span>
                <button
                  onClick={() => alert('Para registrar nova chave Pix, validação via token SMS enviada ao titular.')}
                  className="text-xs text-[#00a854] hover:text-zinc-950 font-semibold flex items-center gap-1"
                >
                  <span>+ Nova Chave</span>
                </button>
              </div>

              <div className="space-y-2">
                {userProfile.pixKeys.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">Nenhuma chave cadastrada.</p>
                ) : (
                  userProfile.pixKeys.map((k, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[#f4f4f5] border border-black/[0.06] rounded-2xl flex items-center justify-between hover:border-[#00e676]/40 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#00a854] block tracking-wider">
                        {k.type === 'cpf' ? 'CPF' : k.type === 'email' ? 'E-mail' : k.type === 'phone' ? 'Celular' : 'Chave Aleatória'}
                      </span>
                      <p className="font-mono text-xs text-zinc-800 mt-0.5">
                        {k.value}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(k.value);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="p-2 text-zinc-400 hover:text-[#00a854] bg-white rounded-xl transition-colors"
                      title="Copiar chave"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PIX LIMITS */}
          {activeTab === 'limits' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#00e676]/10 border border-[#00e676]/30 rounded-2xl text-xs text-zinc-700">
                <p className="font-semibold text-[#00a854] mb-1">Diretrizes de Segurança do Banco Central</p>
                Ajuste os limites diurnos e noturnos para proteger sua conta contra invasões e transações não autorizadas.
              </div>

              {/* Daily Limit */}
              <div className="bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-950 block">Limite Diário (06h às 20h)</span>
                    <span className="text-[11px] text-zinc-500">Transferências para contatos e novas contas</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[#00a854]">
                    R$ {dailyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseFloat(e.target.value))}
                  className="w-full accent-[#00e676] cursor-pointer"
                />
              </div>

              {/* Nightly Limit */}
              <div className="bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-950 block">Limite Noturno (20h às 06h)</span>
                    <span className="text-[11px] text-zinc-500">Trava especial de segurança noturna</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[#00a854]">
                    R$ {nightlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={nightlyLimit}
                  onChange={(e) => setNightlyLimit(parseFloat(e.target.value))}
                  className="w-full accent-[#00e676] cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  onRequestBiometric('Autorizar alteração de limites Pix', () => {
                    // Q13=(A): persiste de verdade via onSavePixLimits.
                    onSavePixLimits?.(dailyLimit, nightlyLimit);
                    setLimitsSaved(true);
                    setTimeout(() => setLimitsSaved(false), 2500);
                  });
                }}
                className="w-full py-3 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
              >
                {limitsSaved ? 'Limites atualizados com sucesso!' : 'Salvar Novos Limites com Biometria'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
