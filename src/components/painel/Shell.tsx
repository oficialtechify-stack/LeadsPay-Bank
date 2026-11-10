import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Route } from '../../lib/routes';
import type { DeveloperApiKey, WebhookConfig } from '../../types';
import type { PainelProps, ShellUi, ThemePref } from './types';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AssistenteFloat } from './AssistenteFloat';
import { PixDrawer } from './PixDrawer';
import { LinkBioModal } from './LinkBioModal';
import { AjudaWidget } from './AjudaWidget';
import { SyncBanner } from './shared';
import { SoonView } from '../SoonView';
import { PainelHome } from './PainelHome';
import { PainelAssistenteView } from './PainelAssistenteView';
import { PainelExtrato } from './PainelExtrato';
import { PainelCartoes } from './PainelCartoes';
import { PainelEmprestimo } from './PainelEmprestimo';
import { PainelVendas } from './PainelVendas';
import { PainelCobranca } from './PainelCobranca';
import { PainelNovaCobranca } from './PainelNovaCobranca';
import { PainelLinkPagamento } from './PainelLinkPagamento';
import { PainelLoja } from './PainelLoja';
import { PainelPlanos } from './PainelPlanos';
import { PainelAgendamentos } from './PainelAgendamentos';
import { PainelCheckout } from './PainelCheckout';
import { PainelCatalogo } from './PainelCatalogo';
import { PainelCardapio } from './PainelCardapio';
import { PainelRecebimentos } from './PainelRecebimentos';
import { PainelClientes } from './PainelClientes';
import { PainelDasMei } from './PainelDasMei';
import { PainelChargeback } from './PainelChargeback';
import { PainelIndique } from './PainelIndique';
import { PainelAcademy } from './PainelAcademy';
import { PainelConfiguracoes } from './PainelConfiguracoes';

/**
 * Shell do painel web novo (v3.1 §4 + v3.2 §D2).
 * Desktop (≥1024px): Sidebar 72px colapsada (expande no hover como
 * overlay, margem de conteúdo 72px) + TopBar + <main> que troca a
 * unidade pela rota + AssistenteFloat + PixDrawer/LinkBioModal/AjudaWidget
 * condicionais ao ShellUi.
 * A rota `negocio` (virtual) renderiza a Gestão de Cobrança (U7);
 * `soon` renderiza o SoonView existente; `pix`/`tap` continuam modais
 * via `navigate` (nunca ganham página aqui).
 */
export interface ShellProps
  extends Omit<PainelProps, 'onOpenPix' | 'onOpenTap' | 'onOpenSecurity'> {
  /** Rota atual (o Shell troca a unidade por ela). */
  route: Route;
  /** Abre o PixModal existente (envio/recebimento interno). */
  onOpenPixModal: (tab: 'send' | 'receive' | 'keys' | 'limits') => void;
  /** Abre o LeadsTapModal existente. */
  onOpenTapModal: () => void;
  /** Abre o SecurityCenterModal existente. */
  onOpenSecurityModal: () => void;
  /** Persiste os limites Pix (usado pelo drawer U23). */
  onSavePixLimits: (daily: number, nightly: number) => void;
  /**
   * Dados da API (chaves/webhooks): o App continua repassando porque o
   * CELULAR usa a tela de API — no painel web a tela não é montada
   * (regra do Rick 10/11: só as telas do mapa web). O Shell ignora.
   */
  apiKeys: DeveloperApiKey[];
  webhooks: WebhookConfig[];
  onGenerateKey: (name: string, env: 'production' | 'sandbox') => void;
  onAddWebhook: (url: string, events: string[]) => void;
  /** Preferência de tema (v3.2 §D7.1) — a U22 final a expõe; o Shell só a repassa. */
  themePref?: ThemePref;
  onThemePrefChange?: (pref: ThemePref) => void;
}

export const Shell: React.FC<ShellProps> = (props) => {
  const {
    route,
    userProfile,
    transactions,
    cards,
    showBalance,
    onToggleBalance,
    navigate,
    onLogout,
    onOpenAdminReview,
    isAdmin,
    syncState,
    shellUi,
    setShellUi,
    onOpenPixModal,
    onOpenTapModal,
    onOpenSecurityModal,
    onSavePixLimits,
    // apiKeys/webhooks/onGenerateKey/onAddWebhook: recebidos do App mas
    // ignorados aqui — a tela de API é só do celular (ver acima).
    onToggleFreeze,
    onUpdateLimit,
    onRefresh,
    themePref,
    onThemePrefChange,
  } = props;

  // Aba inicial do drawer Pix (Chaves/Limites) — estado local do Shell.
  const [pixDrawerTab, setPixDrawerTab] = useState<'keys' | 'limits'>('keys');

  const painelProps: PainelProps = {
    userProfile,
    transactions,
    cards,
    showBalance,
    onToggleBalance,
    navigate,
    onOpenPix: (tab) => {
      if (tab === 'keys' || tab === 'limits') {
        setPixDrawerTab(tab);
        setShellUi({ pixDrawerOpen: true });
      } else {
        onOpenPixModal(tab);
      }
    },
    onOpenTap: () => onOpenTapModal(),
    onOpenSecurity: () => onOpenSecurityModal(),
    onLogout,
    onOpenAdminReview,
    isAdmin,
    syncState,
    shellUi,
    setShellUi,
    onToggleFreeze,
    onUpdateLimit,
    onRefresh,
    themePref,
    onThemePrefChange,
  };

  const renderRoute = (current: Route): React.ReactNode => {
    switch (current.name) {
      case 'conta':
        return <PainelHome {...painelProps} />;
      case 'assistente':
        return <PainelAssistenteView {...painelProps} />;
      case 'extrato':
        return <PainelExtrato {...painelProps} />;
      case 'cartao':
        return <PainelCartoes {...painelProps} />;
      case 'emprestimo':
        return <PainelEmprestimo {...painelProps} />;
      case 'vendas':
        return <PainelVendas {...painelProps} />;
      case 'negocio':
      case 'gestao':
        return <PainelCobranca {...painelProps} />;
      case 'nova-cobranca':
        return <PainelNovaCobranca {...painelProps} />;
      case 'links-pagamento':
        return <PainelLinkPagamento {...painelProps} />;
      case 'loja':
        return <PainelLoja {...painelProps} />;
      case 'planos':
        return <PainelPlanos {...painelProps} />;
      case 'agendamentos':
        return <PainelAgendamentos {...painelProps} />;
      case 'checkout':
        return <PainelCheckout {...painelProps} />;
      case 'catalogo':
        return <PainelCatalogo {...painelProps} />;
      case 'cardapio':
        return <PainelCardapio {...painelProps} />;
      case 'recebimentos':
        return <PainelRecebimentos {...painelProps} />;
      case 'clientes':
        return <PainelClientes {...painelProps} />;
      case 'das-mei':
        return <PainelDasMei {...painelProps} />;
      case 'chargeback':
        return <PainelChargeback {...painelProps} />;
      case 'indique':
        return <PainelIndique {...painelProps} />;
      case 'academy':
        return <PainelAcademy {...painelProps} />;
      case 'ajustes':
        return <PainelConfiguracoes {...painelProps} />;
      // REGRA DO RICK (10/11): no painel web entram SÓ as telas do mapa web
      // da InfinitePay. 'moedas' e 'api' são telas SÓ do celular — não têm
      // tela no desktop e caem no default (Home). Os arquivos
      // MoedasView.tsx e DeveloperApiView.tsx CONTINUAM no repo: o celular
      // usa eles; só a montagem no Shell desktop foi retirada.
      case 'soon':
        return <SoonView title={current.title} reason={current.reason} onBack={navigate} backTo={current.backTo} />;
      default:
        return <PainelHome {...painelProps} />;
    }
  };

  // FIX faixa branca (10/11): a raiz do Shell NÃO tinha largura — como o
  // App.tsx monta o Shell dentro de um flex-col com items-center, o div
  // encolhia para o conteúdo (72 + 1200 = 1272px) e centralizava, deixando
  // o bg-white do App aparecer nas duas laterais. Com w-full o Shell cobre
  // a viewport inteira e as margens passam a ser o fundo do tema.
  return (
    <div className="min-h-screen w-full bg-[var(--shell-bg)] text-[var(--shell-text)]">
      <Sidebar
        route={route}
        navigate={navigate}
        shellUi={shellUi}
        setShellUi={setShellUi}
        userProfile={userProfile}
        onLogout={onLogout}
      />
      <div className="ml-[72px] flex min-h-screen flex-col">
        {/* Home (U1) não tem TopBar — igual à Home da InfinitePay do print. */}
        {route.name !== 'conta' && (
          <TopBar
            userProfile={userProfile}
            showBalance={showBalance}
            onToggleBalance={onToggleBalance}
            setShellUi={setShellUi}
          />
        )}
        {/* Home em largura total (igual ao print); demais telas seguem com
            largura máxima centralizada de 1200px. */}
        <main
          className={
            route.name === 'conta'
              ? 'w-full flex-1 px-6 py-6'
              : 'mx-auto w-full max-w-[1200px] flex-1 px-6 py-6'
          }
        >
          <SyncBanner syncState={syncState} />
          <AnimatePresence mode="wait">
            <motion.div
              key={route.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderRoute(route)}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AssistenteFloat route={route} navigate={navigate} />

      <AnimatePresence>
        {shellUi.pixDrawerOpen && (
          <PixDrawer
            key="pix-drawer"
            userProfile={userProfile}
            initialTab={pixDrawerTab}
            onClose={() => setShellUi({ pixDrawerOpen: false })}
            onSavePixLimits={onSavePixLimits}
            onOpenPixSend={() => {
              setShellUi({ pixDrawerOpen: false });
              onOpenPixModal('send');
            }}
          />
        )}
        {shellUi.linkBioOpen && (
          <LinkBioModal key="link-bio" onClose={() => setShellUi({ linkBioOpen: false })} />
        )}
        {shellUi.ajudaOpen && (
          <AjudaWidget key="ajuda" onClose={() => setShellUi({ ajudaOpen: false })} />
        )}
      </AnimatePresence>
    </div>
  );
};
