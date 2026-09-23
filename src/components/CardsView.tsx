import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  RotateCw, 
  Plus, 
  ShieldCheck, 
  Sliders, 
  Radio, 
  Clock,
  Sparkles
} from 'lucide-react';
import { VirtualCard } from '../types';
import { BrandLogo } from './BrandLogo';

interface CardsViewProps {
  cards: VirtualCard[];
  onToggleFreeze: (cardId: string) => void;
  onUpdateLimit: (cardId: string, newLimit: number) => void;
  onCreateVirtualCard: (name: string, category: VirtualCard['category']) => void;
  onRequestBiometric: (actionName: string, onVerified: () => void) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  cards,
  onToggleFreeze,
  onUpdateLimit,
  onCreateVirtualCard,
  onRequestBiometric
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [cvvTimeLeft, setCvvTimeLeft] = useState(3540); // countdown in seconds
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardCategory, setNewCardCategory] = useState<VirtualCard['category']>('Compras Online');

  const card = cards.find(c => c.id === selectedCardId) || cards[0];

  // Dynamic CVV countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCvvTimeLeft(prev => (prev > 1 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCreate = () => {
    if (!newCardName.trim()) return;
    onCreateVirtualCard(newCardName.trim(), newCardCategory);
    setNewCardName('');
    setIsNewCardModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Card selector pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <span>Cartões LeadsPay</span>
            <span className="text-xs bg-[#00e676]/20 text-[#00e676] px-2 py-0.5 rounded-full font-mono">
              Virtual Dinâmico
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Segurança de ponta com CVV temporário e bloqueio instantâneo
          </p>
        </div>

        <button
          onClick={() => setIsNewCardModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00e676] border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Cartão Virtual</span>
        </button>
      </div>

      {/* Card selector segmented tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {cards.map(c => (
          <button
            key={c.id}
            onClick={() => { setSelectedCardId(c.id); setIsFlipped(false); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              c.id === card.id
                ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{c.name}</span>
            {c.isFrozen && (
              <span className="text-[10px] text-red-400 bg-red-950/60 px-1 py-0.2 rounded border border-red-800/40">
                Bloqueado
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3D Flippable Titanium Card */}
      <div className="flex flex-col items-center justify-center">
        <div 
          className="relative w-full max-w-[360px] sm:max-w-[380px] aspect-[1.62/1] min-h-[200px] cursor-pointer select-none perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full relative rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
          >
            {/* FRONT OF CARD */}
            <div 
              style={{ 
                backfaceVisibility: 'hidden',
                background: card.color
              }}
              className="absolute inset-0 rounded-2xl p-5 border border-white/15 flex flex-col justify-between overflow-hidden shadow-2xl"
            >
              {/* Subtle metallic texture & light overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-emerald-400/10 pointer-events-none" />
              
              {/* Freeze overlay if frozen */}
              {card.isFrozen && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-red-400">
                  <Lock className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cartão Bloqueado</span>
                  <span className="text-[10px] text-slate-300">Toque abaixo para desbloquear</span>
                </div>
              )}

              {/* Card Header: Brand & Contactless Icon */}
              <div className="flex items-center justify-between relative z-10">
                <BrandLogo size="sm" />
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 rotate-90" />
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/70">
                    {card.type === 'virtual' ? 'VIRTUAL' : 'METAL'}
                  </span>
                </div>
              </div>

              {/* Smart Chip & Hologram */}
              <div className="flex items-center gap-3 relative z-10 my-auto">
                <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-yellow-300 via-amber-200 to-yellow-500 border border-yellow-400/60 shadow-inner flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-900/30 rounded-xs grid grid-cols-2 gap-0.5 opacity-60" />
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{card.category}</span>
                </div>
              </div>

              {/* Card Number & Holder info */}
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono-numbers text-base sm:text-lg font-bold tracking-widest text-white drop-shadow">
                    {showFullNumber ? card.cardNumber.replace(/••••/g, '7829') : card.cardNumber}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullNumber(!showFullNumber);
                    }}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {showFullNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Titular</span>
                    <span className="font-semibold text-white tracking-wide text-[11px]">{card.cardHolder}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Validade</span>
                    <span className="font-mono text-slate-200 text-[11px]">{card.expiry}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Bandeira</span>
                    <span className="font-bold uppercase tracking-wider text-white text-[11px]">{card.brand}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK OF CARD */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: '#0d120f'
              }}
              className="absolute inset-0 rounded-2xl p-5 border border-white/15 flex flex-col justify-between overflow-hidden shadow-2xl"
            >
              {/* Magnetic Stripe */}
              <div className="-mx-5 -mt-1 h-10 bg-black border-y border-white/10" />

              {/* Security Signature & CVV box */}
              <div className="my-auto space-y-2">
                <div className="bg-white/90 p-2 rounded-lg text-black flex items-center justify-between font-mono">
                  <span className="text-[10px] text-slate-500 italic">Authorized Signature</span>
                  <div className="bg-slate-900 text-emerald-400 px-3 py-1 rounded text-sm font-bold tracking-widest flex items-center gap-1.5">
                    <span>CVV {card.cvv}</span>
                    <Clock className="w-3 h-3 text-[#00e676]" />
                  </div>
                </div>

                {card.type === 'virtual' && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 bg-emerald-950/60 p-2 rounded-xl border border-emerald-500/30">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Novo CVV dinâmico em:</span>
                    </span>
                    <span className="font-mono font-bold">{formatCountdown(cvvTimeLeft)}</span>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="text-[9px] text-slate-500 text-center leading-tight">
                Emitido por LeadsPay S.A. Sob licença Mastercard/Visa International.
                Uso sujeito aos termos e condições do app LeadsPay.
              </div>
            </div>
          </motion.div>
        </div>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="mt-3 text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Toque para virar o cartão (ver {isFlipped ? 'frente' : 'verso e CVV'})</span>
        </button>
      </div>

      {/* Card Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => handleCopy(card.cardNumber.replace(/\s+/g, ''))}
          className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
            {copiedNumber ? <Check className="w-4 h-4 text-[#00e676]" /> : <Copy className="w-4 h-4" />}
          </div>
          <span className="text-xs font-semibold text-white block">
            {copiedNumber ? 'Copiado!' : 'Copiar Dados'}
          </span>
          <span className="text-[10px] text-slate-400">Número para compras</span>
        </button>

        <button
          onClick={() => {
            onRequestBiometric(
              card.isFrozen ? 'Desbloquear cartão' : 'Bloquear temporariamente o cartão',
              () => onToggleFreeze(card.id)
            );
          }}
          className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform ${
            card.isFrozen ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-emerald-400'
          }`}>
            {card.isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <span className="text-xs font-semibold text-white block">
            {card.isFrozen ? 'Desbloquear' : 'Bloquear'}
          </span>
          <span className="text-[10px] text-slate-400">Proteção instantânea</span>
        </button>

        <button
          onClick={() => {
            const newLim = prompt('Defina o novo limite em R$:', card.limit.toString());
            if (newLim && !isNaN(parseFloat(newLim))) {
              onUpdateLimit(card.id, parseFloat(newLim));
            }
          }}
          className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white block">Ajustar Limite</span>
          <span className="text-[10px] text-slate-400">R$ {card.limit.toLocaleString('pt-BR')}</span>
        </button>

        <button
          onClick={() => alert('Configurações do Cartão: Compras internacionais ativadas, Aproximação NFC habilitada, Senha de 4 dígitos verificada.')}
          className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white block">Configurações</span>
          <span className="text-[10px] text-slate-400">Senha e Aproximação</span>
        </button>
      </div>

      {/* Limit & Spending Progress Card */}
      <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Limite Utilizado</span>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              R$ {card.usedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400">Limite Disponível</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              R$ {(card.limit - card.usedLimit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#00e676] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (card.usedLimit / card.limit) * 100)}%` }}
          />
        </div>
      </div>

      {/* Modal: Create Virtual Card */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#0e1410] border border-emerald-500/30 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-lg font-display font-bold">Criar Novo Cartão Virtual</h3>
            <p className="text-xs text-slate-400">
              Crie cartões separados para assinaturas, streaming ou compras em sites pontuais.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Identificação do Cartão</label>
              <input
                type="text"
                placeholder="Ex: Assinaturas de Streaming"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Finalidade / Categoria</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Compras Online', 'Assinaturas', 'Uso Diário', 'Corporativo'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCardCategory(cat)}
                    className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      newCardCategory === cat
                        ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676]'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsNewCardModalOpen(false)}
                className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newCardName.trim()}
                className="w-1/2 py-2.5 bg-[#00e676] hover:bg-[#00c853] disabled:opacity-40 text-black text-xs font-bold rounded-xl shadow-lg"
              >
                Criar Cartão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
