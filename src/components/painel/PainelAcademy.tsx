import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, Play } from 'lucide-react';
import { SPRING } from '../ui';
import type { PainelProps } from './types';

/**
 * U21 — Academy (v3.1 §8-U21).
 * Shell escuro PRÓPRIO, sempre escuro, independente do tema do painel.
 * Conteúdo 100% da LeadsTap; nenhum curso de terceiros. Estado vazio
 * honesto: os cursos ainda não estão publicados.
 */
export const PainelAcademy: React.FC<PainelProps> = () => {
  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  return (
    <div className="rounded-[24px] bg-[#0B0B0C] px-5 py-6 text-[#F5F5F5] sm:px-8 sm:py-8">
      <motion.div {...stagger(0)}>
        <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
          <GraduationCap className="w-6 h-6" /> Academy
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#9CA3AF]">
          Aprenda a vender mais — cursos e materiais da LeadsTap.
        </p>
        <a
          href="#cursos-academy"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#C6FF4A] px-5 py-3 text-[14px] font-semibold text-black"
        >
          <Play className="w-4 h-4" /> Ver cursos
        </a>
      </motion.div>

      <motion.div {...stagger(1)} id="cursos-academy" className="mt-8 scroll-mt-4">
        <h2 className="text-[20px] font-bold tracking-[-0.02em]">Destaques</h2>
        <div className="mt-3 rounded-[20px] bg-[#17181A] p-5">
          <p className="font-semibold">Ainda não há cursos publicados.</p>
          <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
            Quando o primeiro curso da LeadsTap sair, ele aparece aqui.
          </p>
        </div>
      </motion.div>

      <motion.div {...stagger(2)} className="mt-8">
        <h2 className="text-[20px] font-bold tracking-[-0.02em]">Recomendados</h2>
        <div className="mt-3 rounded-[20px] bg-[#17181A] p-5">
          <p className="font-semibold">Ainda não há cursos publicados.</p>
          <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
            As recomendações aparecem quando houver cursos na Academy.
          </p>
        </div>
      </motion.div>

      <motion.div {...stagger(3)} className="mt-8">
        <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em]">
          <BookOpen className="w-5 h-5" /> Materiais
        </h2>
        <div className="mt-3 rounded-[20px] bg-[#17181A] p-5">
          <p className="font-semibold">Ainda não há materiais publicados.</p>
          <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
            Guias e modelos da LeadsTap aparecem aqui quando forem publicados.
          </p>
          <button
            type="button"
            disabled
            title="Ainda não há materiais publicados."
            className="mt-4 rounded-full bg-[#2C2D32] px-5 py-3 text-[14px] font-semibold text-[#6B7280]"
          >
            Ver materiais
          </button>
        </div>
      </motion.div>
    </div>
  );
};
