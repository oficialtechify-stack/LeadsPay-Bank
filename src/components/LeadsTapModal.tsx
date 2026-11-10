import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Share2, 
  Receipt, 
  Shield, 
  Sparkles,
  Zap,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/audio';
import { Transaction } from '../types';

interface LeadsTapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction: (tx: Transaction) => void;
}

export const LeadsTapModal: React.FC<LeadsTapModalProps> = ({
  isOpen,
  onClose,
  onNewTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'charge' | 'pay'>('charge'); // charge (celular em maquininha) or pay (pagar com meu celular)
  const [step, setStep] = useState<'amount' | 'waiting_tap' | 'approved'>('amount');
  const [amountStr, setAmountStr] = useState('');
  const [modality, setModality] = useState<'debit' | 'credit' | 'installments'>('credit');
  const [installments, setInstallments] = useState(1);
  const [isProcessingNfc, setIsProcessingNfc] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    amount: number;
    authCode: string;
    nsu: string;
    cardBrand: string;
    cardLast4: string;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartTapDetection = () => {
    const numericAmount = parseFloat(amountStr) || 0;
    if (numericAmount <= 0) return;
    setStep('waiting_tap');
    soundEffects.playNfcTap();
  };

  const handleSimulatePhysicalTap = () => {
    // §7.4: sem valor digitado/pressionado, sem valor — nada de fallback
    // R$ 85,00. Os chips só valem quando pressionados.
    const numAmount = parseFloat(amountStr) || 0;
    if (numAmount <= 0) return;
    setIsProcessingNfc(true);
    soundEffects.playNfcTap();

    setTimeout(() => {
      soundEffects.playPosApproval();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00e676', '#a3e635', '#ffffff']
      });

      const now = new Date();
      const nsu = Math.floor(10000000 + Math.random() * 90000000).toString();
      const auth = 'AUT' + Math.floor(100000 + Math.random() * 900000).toString();
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();

      setReceiptData({
        amount: numAmount,
        authCode: auth,
        nsu: nsu,
        cardBrand: 'Mastercard Débito/Crédito',
        cardLast4: last4,
        timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });

      // Q12=(A): a direção do Tap passa a ser registrada no sinal do valor —
      // cobrar grava positivo (venda), pagar grava negativo (mesma convenção
      // do Pix, PixModal:128). Vale SÓ para registros novos; o histórico já
      // registrado não é reescrito (regra 9 do §6).
      const isCharge = activeTab === 'charge';

      // Register new transaction in bank
      const newTx: Transaction = {
        id: 'tx-tap-' + Date.now(),
        type: 'tap_to_pay',
        title: isCharge ? 'Venda LeadsTap (Aproximação)' : 'Pagamento LeadsTap (Aproximação)',
        description: `${modality === 'debit' ? 'Débito' : 'Crédito'} final ${last4}`,
        amount: isCharge ? numAmount : -numAmount,
        timestamp: now.toISOString(),
        dateFormatted: 'Hoje às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category: isCharge ? 'Vendas' : 'Outros',
        status: 'completed',
        recipientOrSender: isCharge ? 'Venda Balcão NFC' : 'Pagamento por aproximação',
        e2eId: `E592TAP${nsu}`,
        authMethod: 'LeadsTap NFC'
      };

      onNewTransaction(newTx);
      setIsProcessingNfc(false);
      setStep('approved');
    }, 1100);
  };

  const resetFlow = () => {
    setStep('amount');
    setReceiptData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.15)] text-zinc-950 flex flex-col max-h-[92vh]"
      >
        {/* Top bar */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00a854]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 flex items-center gap-1.5">
                <span>LeadsTap</span>
                <span className="text-[10px] bg-[#00e676]/15 text-[#00a854] px-1.5 py-0.5 rounded font-mono font-semibold">
                  NFC Contactless
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Transforme seu celular em maquininha de cartão
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

        {/* Tab switch: Cobrar (Maquininha) vs Pagar */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 p-1 bg-[#f4f4f5] border border-black/[0.06] rounded-xl">
            <button
              onClick={() => { setActiveTab('charge'); resetFlow(); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'charge'
                  ? 'bg-zinc-950 text-white border border-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Receber (Maquininha)</span>
            </button>
            <button
              onClick={() => { setActiveTab('pay'); resetFlow(); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pay'
                  ? 'bg-zinc-950 text-white border border-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pagar por Aproximação</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto">
          {step === 'amount' && (
            <div className="space-y-4">
              {/* Informative banner */}
              <div className="p-3 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#00e676] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-[#00a854]">
                    {activeTab === 'charge' ? 'Receba sem maquininha física' : 'Pague aproximando este celular'}
                  </p>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    {activeTab === 'charge' 
                      ? 'Compatível com cartões físicos e carteiras Apple Pay, Google Pay e Samsung Pay.'
                      : 'Utilize o sensor NFC do seu aparelho com autenticação biométrica instantânea.'}
                  </p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-4 text-center">
                <label className="text-xs text-zinc-500 font-medium block mb-1">
                  {activeTab === 'charge' ? 'Valor da Venda' : 'Valor a Pagar'}
                </label>
                <div className="flex items-center justify-center gap-1 text-3xl font-extrabold text-zinc-950">
                  <span className="text-[#00a854] text-xl font-normal">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="bg-transparent text-center font-mono-numbers outline-none max-w-[200px] border-b border-emerald-500/50 pb-1"
                  />
                </div>
              </div>

              {/* Quick amount chips */}
              <div className="flex items-center justify-center gap-2">
                {[20, 50, 85, 150, 4200].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmountStr(val.toFixed(2))}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#00e676]/15 text-zinc-600 hover:text-[#00a854] text-xs font-mono border border-black/[0.06] transition-all"
                  >
                    +R${val}
                  </button>
                ))}
              </div>

              {/* Modality Selection (Débito / Crédito) */}
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-500 font-medium">Forma de Pagamento</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setModality('debit')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      modality === 'debit'
                        ? 'bg-zinc-950 border-zinc-950 text-white'
                        : 'bg-[#f4f4f5] border-black/[0.06] text-zinc-600 hover:bg-zinc-200/60'
                    }`}
                  >
                    Débito
                  </button>
                  <button
                    onClick={() => setModality('credit')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      modality === 'credit'
                        ? 'bg-zinc-950 border-zinc-950 text-white'
                        : 'bg-[#f4f4f5] border-black/[0.06] text-zinc-600 hover:bg-zinc-200/60'
                    }`}
                  >
                    Crédito à vista
                  </button>
                  <button
                    onClick={() => setModality('installments')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      modality === 'installments'
                        ? 'bg-zinc-950 border-zinc-950 text-white'
                        : 'bg-[#f4f4f5] border-black/[0.06] text-zinc-600 hover:bg-zinc-200/60'
                    }`}
                  >
                    Parcelado
                  </button>
                </div>
              </div>

              {/* Installments selector if parcelado */}
              {modality === 'installments' && (
                <div className="bg-[#f4f4f5] p-3 rounded-xl border border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Número de parcelas:</span>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                    className="bg-white border border-black/[0.06] text-zinc-950 rounded-lg px-3 py-1 outline-none text-xs"
                  >
                    {[2, 3, 4, 5, 6, 10, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x de R$ {((parseFloat(amountStr) || 0) / n).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleStartTapDetection}
                className="w-full py-3.5 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,230,118,0.4)] active:scale-[0.99] mt-2"
              >
                <Radio className="w-4 h-4 text-black animate-pulse" />
                <span>{activeTab === 'charge' ? 'Cobrar com LeadsTap (NFC)' : 'Pagar com LeadsTap (NFC)'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          )}

          {/* STEP 2: Waiting for Tap (Aproxime o cartão / celular) */}
          {step === 'waiting_tap' && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              {/* Value prompt */}
              <div className="mb-4">
                <span className="text-xs text-zinc-500">Aproxime o cartão ou celular na traseira do aparelho</span>
                <div className="text-3xl font-black text-zinc-950 mt-1">
                  R$ {parseFloat(amountStr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-[#00a854] font-medium">
                  {modality === 'debit' ? 'Débito' : modality === 'credit' ? 'Crédito à vista' : `${installments}x Parcelado`}
                </span>
              </div>

              {/* Interactive Phone & NFC Waves Graphic */}
              <div className="relative w-44 h-44 flex items-center justify-center my-3">
                {/* Glowing pulsating rings (NFC Waves) */}
                <div className="absolute w-36 h-36 rounded-full border-2 border-[#00e676]/40 animate-nfc-ring pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full border-2 border-[#00e676]/60 animate-nfc-ring delay-300 pointer-events-none" />

                {/* Central NFC Terminal Graphic */}
                <div className="relative z-10 w-24 h-36 rounded-2xl bg-gradient-to-b from-[#18261e] to-[#0c140e] border-2 border-[#00e676] shadow-[0_0_30px_rgba(0,230,118,0.3)] flex flex-col items-center justify-center p-2">
                  <Radio className="w-7 h-7 text-[#00e676] animate-pulse mb-1" />
                  <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                    {isProcessingNfc ? 'LENDO...' : 'APROXIME'}
                  </span>
                  <div className="w-6 h-0.5 bg-[#00e676] rounded-full mt-2" />
                </div>
              </div>

              <p className="text-xs text-zinc-500 max-w-xs mt-2">
                Aproxime o cartão físico ou abra a carteira digital (Apple Pay / Google Pay / Samsung Pay).
              </p>

              {/* Tap Simulator Trigger Button */}
              <div className="w-full mt-6 space-y-2">
                <button
                  onClick={handleSimulatePhysicalTap}
                  disabled={isProcessingNfc}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-[#00e676] hover:from-emerald-400 hover:to-[#00e676] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,230,118,0.5)] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{isProcessingNfc ? 'Processando leitura...' : 'Simular Aproximação de Cartão'}</span>
                </button>

                <button
                  onClick={() => setStep('amount')}
                  className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-950 transition-colors"
                >
                  Cancelar e alterar valor
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Approved Payment (Matching user's image with "Pagamento aprovado") */}
          {step === 'approved' && receiptData && (
            <div className="flex flex-col items-center text-center py-2">
              {/* Big Checkmark */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-[#00e676] flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(0,230,118,0.4)]"
              >
                <CheckCircle2 className="w-10 h-10 text-[#00e676]" />
              </motion.div>

              {/* Amount Display */}
              <span className="text-xs text-zinc-500 font-medium">Pagamento aprovado</span>
              <div className="text-3xl font-black text-zinc-950 mt-1">
                R$ {receiptData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              {/* Receipt Details Card */}
              <div className="w-full bg-[#f4f4f5] border border-black/[0.06] rounded-2xl p-4 mt-4 text-left text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <span className="text-zinc-500">Modalidade</span>
                  <span className="font-semibold text-zinc-950">
                    {modality === 'debit' ? 'Débito' : modality === 'credit' ? 'Crédito à vista' : `${installments}x Parcelado`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Cartão</span>
                  <span className="font-mono text-zinc-800">•••• •••• •••• {receiptData.cardLast4}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Autorização</span>
                  <span className="font-mono text-[#00a854]">{receiptData.authCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">NSU</span>
                  <span className="font-mono text-zinc-600">{receiptData.nsu}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-black/[0.06]">
                  <span className="text-zinc-500">Horário</span>
                  <span className="text-zinc-800">{receiptData.timestamp}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full mt-5 space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    resetFlow();
                  }}
                  className="w-full py-3 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
                >
                  Continuar
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => alert('Comprovante LeadsTap copiado para área de transferência!')}
                    className="py-2.5 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-black/10"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </button>
                  <button
                    onClick={resetFlow}
                    className="py-2.5 bg-white hover:bg-zinc-100 text-[#00a854] rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-black/10"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{activeTab === 'charge' ? 'Nova Venda' : 'Novo Pagamento'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
