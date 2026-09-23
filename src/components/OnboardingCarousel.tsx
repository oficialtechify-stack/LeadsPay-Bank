import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  ChevronUp, 
  ChevronDown, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Smartphone, 
  ChevronRight,
  Sparkles,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { initialOnboardingSlides } from '../data/mockData';
import { BrandLogo } from './BrandLogo';

// Professional 3D Icons
import iconTransfer from '../assets/images/icon_transfer_1790117885423.jpg';
import iconPayBill from '../assets/images/icon_pay_bill_1790117898657.jpg';
import iconPixGlow from '../assets/images/icon_pix_glow_1790117909044.jpg';
import iconLeadsTapNfc from '../assets/images/icon_leadstap_nfc_1790117921096.jpg';

interface OnboardingCarouselProps {
  onAccessAccount: () => void;
  onOpenQuickPix: () => void;
  onOpenSupport: () => void;
  onOpenTapToPay: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  onAccessAccount,
  onOpenQuickPix,
  onOpenSupport,
  onOpenTapToPay
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Auto advance slides every 5 seconds when bottom sheet is NOT expanded
  useEffect(() => {
    if (isPaused || isSheetExpanded) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % initialOnboardingSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, isSheetExpanded]);

  const slide = initialOnboardingSlides[currentSlide];

  // Drag handler for pull up / pull down gesture
  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y < -40 || info.velocity.y < -200) {
      // Pulled UP -> Expand sheet
      setIsSheetExpanded(true);
    } else if (info.offset.y > 40 || info.velocity.y > 200) {
      // Pulled DOWN -> Collapse sheet
      setIsSheetExpanded(false);
    }
  };

  return (
    <div 
      className="relative w-full h-[100dvh] min-h-[580px] flex flex-col justify-between overflow-hidden bg-black text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Cinematic Slide Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {/* Dark gradient overlay for ultra clean contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/35" />
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/90" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
        <BrandLogo size="md" />
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenSupport}
            className="text-[11px] text-emerald-400 hover:text-white bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all backdrop-blur-md active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            Suporte 24/7
          </button>
        </div>
      </header>

      {/* Middle Slide Content (Fades out gently when sheet is fully pulled up) */}
      <motion.div 
        animate={{ opacity: isSheetExpanded ? 0.35 : 1, y: isSheetExpanded ? -20 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-5 sm:px-6 my-auto text-center flex flex-col items-center max-w-lg mx-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id + '-content'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center w-full"
          >
            {/* Badge pill */}
            <div className="inline-flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-emerald-500/30 px-3.5 py-1 rounded-full text-[11px] font-semibold text-emerald-300 mb-3 shadow-lg">
              <Zap className="w-3.5 h-3.5 text-[#00e676]" />
              <span>{slide.tag}</span>
              <span className="text-slate-500">·</span>
              <span className="text-white/85">{slide.badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-md">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-200 font-medium mb-1.5 drop-shadow">
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs leading-relaxed">
              {slide.description}
            </p>

            {/* LeadsTap interactive test CTA */}
            {slide.id === 'slide-tap' && (
              <button
                onClick={onOpenTapToPay}
                className="mt-3.5 inline-flex items-center gap-2 bg-[#00e676]/20 hover:bg-[#00e676]/30 text-[#00e676] border border-[#00e676]/50 px-4 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md shadow-[0_0_15px_rgba(0,230,118,0.25)] active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Experimentar Aproximação</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Slide Pagination Dots */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 mb-2">
        {initialOnboardingSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'w-6 bg-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.8)]'
                : 'w-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* PULL-UP INTERACTIVE BOTTOM SHEET (DRAGGABLE / GESTURE DRIVEN) */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{
          height: isSheetExpanded ? '82dvh' : 'auto',
          y: 0
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative z-20 w-full bg-[#0c120e]/95 backdrop-blur-2xl border-t border-emerald-500/30 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] flex flex-col transition-colors overflow-hidden"
      >
        {/* Drag Handle Bar & Pull Hint */}
        <div 
          onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          className="w-full pt-3 pb-2.5 flex flex-col items-center justify-center cursor-pointer active:opacity-75 touch-none"
        >
          {/* Handle pill */}
          <div className="w-12 h-1.5 bg-white/30 hover:bg-[#00e676] rounded-full transition-colors mb-1 shadow-sm" />
          
          <div className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-medium tracking-wide">
            {isSheetExpanded ? (
              <>
                <span>Deslize para recolher</span>
                <ChevronDown className="w-3 h-3 text-[#00e676]" />
              </>
            ) : (
              <>
                <span>Puxe para cima</span>
                <ChevronUp className="w-3 h-3 text-[#00e676] animate-bounce" />
              </>
            )}
          </div>
        </div>

        {/* Scrollable Container inside sheet when expanded */}
        <div className="px-4 sm:px-5 pb-6 overflow-y-auto space-y-4 max-h-full">
          {/* Quick Action Buttons with Professional 3D Icons */}
          <div className="grid grid-cols-4 gap-2">
            {/* 1. Transferir */}
            <button
              onClick={onOpenQuickPix}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/40 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_12px_rgba(0,230,118,0.2)] mb-1.5 group-hover:scale-105 transition-transform bg-black">
                <img 
                  src={iconTransfer} 
                  alt="Transferir" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-[#00e676] transition-colors">
                Transferir
              </span>
            </button>

            {/* 2. Pagar */}
            <button
              onClick={onOpenQuickPix}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/40 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_12px_rgba(0,230,118,0.2)] mb-1.5 group-hover:scale-105 transition-transform bg-black">
                <img 
                  src={iconPayBill} 
                  alt="Pagar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-[#00e676] transition-colors">
                Pagar
              </span>
            </button>

            {/* 3. Área Pix */}
            <button
              onClick={onOpenQuickPix}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/40 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_12px_rgba(0,230,118,0.2)] mb-1.5 group-hover:scale-105 transition-transform bg-black">
                <img 
                  src={iconPixGlow} 
                  alt="Área Pix" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-[#00e676] transition-colors">
                Área Pix
              </span>
            </button>

            {/* 4. LeadsTap */}
            <button
              onClick={onOpenTapToPay}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/40 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_12px_rgba(0,230,118,0.2)] mb-1.5 group-hover:scale-105 transition-transform bg-black">
                <img 
                  src={iconLeadsTapNfc} 
                  alt="LeadsTap" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-[#00e676] transition-colors">
                LeadsTap
              </span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onAccessAccount}
              className="w-full h-12 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(0,230,118,0.35)] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>Acessar conta LeadsPay</span>
            </button>

            <button
              onClick={onAccessAccount}
              className="w-full h-11 bg-black/40 hover:bg-white/5 text-emerald-400 border border-emerald-500/30 font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4" />
              <span>Abrir uma conta gratuita</span>
            </button>
          </div>

          {/* Extra Content revealed when pulled up */}
          <AnimatePresence>
            {isSheetExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-2 space-y-3 border-t border-white/10"
              >
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-white">Vantagens Exclusivas LeadsPay</span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Digital</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>LeadsTap no Celular</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Venda no débito e crédito por aproximação no seu telefone sem custo de maquininha.
                    </p>
                  </div>

                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Biometria & Modo Rua</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Proteção facial e ocultação inteligente de saldos fora de casa.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-2">
                  <span className="text-xs text-emerald-300 font-medium block">
                    Integração fácil para desenvolvedores e lojas parceiras
                  </span>
                  <button
                    onClick={onAccessAccount}
                    className="text-xs text-black bg-[#00e676] px-4 py-1.5 rounded-lg font-bold inline-flex items-center gap-1"
                  >
                    <span>Explorar Sandbox da API</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom helper text */}
          <div className="text-center pt-1">
            <button
              onClick={onOpenSupport}
              className="text-[11px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition-colors py-1"
            >
              <span>Precisa de ajuda ou dúvidas sobre a API?</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
