import React from 'react';
import { Clock } from 'lucide-react';
import { BackButton, Card, SoonBadge } from './ui';
import type { Route } from '../lib/routes';

/**
 * Tela genérica de função indisponível — "em breve" com o motivo.
 * Regra do plano §6.5: função sem trilho não aparece como se funcionasse.
 */
export const SoonView: React.FC<{
  title: string;
  reason: string;
  onBack: (route: Route) => void;
  backTo: Route;
}> = ({ title, reason, onBack, backTo }) => (
  <div className="space-y-4">
    <BackButton onClick={() => onBack(backTo)} />
    <Card className="text-center py-8">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white">
        <Clock className="w-6 h-6 text-zinc-900" />
      </span>
      <h1 className="text-[22px] font-bold tracking-[-0.02em] mt-4 text-zinc-950">{title}</h1>
      <p className="mt-2">
        <SoonBadge />
      </p>
      <p className="text-sm text-zinc-500 mt-3 leading-relaxed max-w-xs mx-auto">{reason}</p>
      <p className="text-xs text-zinc-400 mt-4 leading-relaxed max-w-xs mx-auto">
        Nada aqui move dinheiro. Quando o recurso existir de verdade, ele aparece
        aqui funcionando — não antes.
      </p>
    </Card>
  </div>
);
