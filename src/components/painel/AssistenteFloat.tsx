import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Route } from '../../lib/routes';
import type { ShellUi } from './types';

/**
 * Botão flutuante do Assistente (v3.2 §D3): laranja, "Falar com o
 * Assistente". Abre a rota assistente guardando a rota atual em
 * `assistenteReturn`. Some na própria tela do Assistente.
 */
export const AssistenteFloat: React.FC<{
  route: Route;
  navigate: (next: Route, opts?: Partial<ShellUi>) => void;
}> = ({ route, navigate }) => {
  if (route.name === 'assistente') return null;
  return (
    <button
      type="button"
      onClick={() =>
        navigate({ name: 'assistente' }, { assistenteReturn: route })
      }
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--shell-orange)] px-5 py-3.5 text-[14px] font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <Sparkles className="w-5 h-5" />
      Falar com o Assistente
    </button>
  );
};
