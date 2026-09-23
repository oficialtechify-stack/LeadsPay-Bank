import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LoginEntryView } from './components/LoginEntryView';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar, MainTab } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { ExtratoView } from './components/ExtratoView';
import { CardsView } from './components/CardsView';
import { AjustesView } from './components/AjustesView';
import { FinancialManagementView } from './components/FinancialManagementView';
import { DeveloperApiView } from './components/DeveloperApiView';
import { PixModal } from './components/PixModal';
import { LeadsTapModal } from './components/LeadsTapModal';
import { Support247Chat } from './components/Support247Chat';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import { TokenModal } from './components/TokenModal';
import { OpenAccountModal } from './components/OpenAccountModal';
import { NotificationToast, BankNotification } from './components/NotificationToast';
import { 
  initialUserProfile, 
  initialTransactions, 
  initialVirtualCards, 
  initialFinancialCategories, 
  initialApiKeys, 
  initialWebhooks 
} from './data/mockData';
import { Transaction, VirtualCard, DeveloperApiKey, WebhookConfig } from './types';
import { soundEffects } from './utils/audio';

export default function App() {
  // Screen and Tab state: starts at the exact entry screen requested
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'bank'>('onboarding');
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Core bank data state
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [cards, setCards] = useState<VirtualCard[]>(initialVirtualCards);
  const [categories, setCategories] = useState(initialFinancialCategories);
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>(initialApiKeys);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(initialWebhooks);

  // Modals state
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isTapToPayOpen, setIsTapToPayOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isOpenAccountModalOpen, setIsOpenAccountModalOpen] = useState(false);
  const [notification, setNotification] = useState<BankNotification | null>(null);

  // Biometric gate modal
  const [biometricConfig, setBiometricConfig] = useState<{
    isOpen: boolean;
    title: string;
    reason?: string;
    onVerified: () => void;
  }>({
    isOpen: false,
    title: 'Autenticação Biométrica',
    onVerified: () => {}
  });

  // Helper to trigger biometric check
  const requestBiometric = (actionName: string, onVerified: () => void) => {
    if (!userProfile.biometricEnabled) {
      onVerified();
      return;
    }
    setBiometricConfig({
      isOpen: true,
      title: actionName,
      reason: 'Por favor, autentique com Face ID ou Touch ID para confirmar esta operação.',
      onVerified: () => {
        setBiometricConfig(prev => ({ ...prev, isOpen: false }));
        onVerified();
      }
    });
  };

  // Handle New Transaction (Pix, Tap to Pay, Card)
  const handleNewTransaction = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);

    // Update user balance
    setUserProfile(prev => ({
      ...prev,
      balance: prev.balance + newTx.amount
    }));

    // If it's a Tap to Pay sale, update the Vendas category
    if (newTx.type === 'tap_to_pay') {
      setCategories(prev => prev.map(c => {
        if (c.name.includes('Vendas')) {
          return { ...c, amount: c.amount + newTx.amount };
        }
        return c;
      }));
    }

    // Trigger push notification toast
    setNotification({
      id: Date.now().toString(),
      title: newTx.type === 'tap_to_pay' ? 'Venda LeadsTap Aprovada!' : 'Transação Realizada!',
      message: `${newTx.title}: ${newTx.amount > 0 ? '+' : ''}R$ ${Math.abs(newTx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      type: newTx.type === 'tap_to_pay' ? 'tap' : 'pix',
      amount: newTx.amount
    });
  };

  // Card Freeze Toggle
  const handleToggleFreeze = (cardId: string) => {
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const nextState = !c.isFrozen;
        setNotification({
          id: Date.now().toString(),
          title: nextState ? 'Cartão Bloqueado' : 'Cartão Desbloqueado',
          message: `${c.name} foi ${nextState ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
          type: 'card'
        });
        return { ...c, isFrozen: nextState };
      }
      return c;
    }));
  };

  // Card Limit Update
  const handleUpdateLimit = (cardId: string, newLimit: number) => {
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, limit: newLimit } : c)));
    setNotification({
      id: Date.now().toString(),
      title: 'Limite Atualizado',
      message: `Novo limite de R$ ${newLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} definido.`,
      type: 'card'
    });
  };

  // Create Virtual Card
  const handleCreateVirtualCard = (name: string, category: VirtualCard['category']) => {
    const last4 = Math.floor(1000 + Math.random() * 9000);
    const newCard: VirtualCard = {
      id: 'card-' + Date.now(),
      name,
      type: 'virtual',
      cardNumber: `5482 •••• •••• ${last4}`,
      cardHolder: userProfile.name.toUpperCase(),
      expiry: '09/31',
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      cvvExpiresInSeconds: 86400,
      isFrozen: false,
      limit: 5000.00,
      usedLimit: 0,
      brand: 'mastercard',
      color: 'linear-gradient(135deg, #0f1c13 0%, #172c1e 70%, #00e676 220%)',
      category
    };
    setCards(prev => [newCard, ...prev]);
    soundEffects.playPixSuccess();
    setNotification({
      id: Date.now().toString(),
      title: 'Cartão Virtual Criado!',
      message: `${name} gerado instantaneamente com CVV dinâmico.`,
      type: 'card'
    });
  };

  // Developer API handlers
  const handleGenerateKey = (name: string, env: 'production' | 'sandbox') => {
    const hex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const prefix = env === 'production' ? 'lp_live_' : 'lp_test_';
    const newKey: DeveloperApiKey = {
      id: 'key-' + Date.now(),
      name,
      keyPrefix: `${prefix}${hex.substring(0, 4)}••••••••••••••••`,
      fullKey: `${prefix}${hex}`,
      environment: env,
      createdAt: 'Hoje',
      lastUsed: 'Nunca'
    };
    setApiKeys(prev => [newKey, ...prev]);
    soundEffects.playPixSuccess();
  };

  const handleAddWebhook = (url: string, events: string[]) => {
    const newWh: WebhookConfig = {
      id: 'wh-' + Date.now(),
      url,
      secret: 'whsec_' + Math.random().toString(36).substring(2, 16),
      events,
      isActive: true,
      lastDeliveryStatus: '200_ok',
      lastDeliveryTime: 'Registrado agora'
    };
    setWebhooks(prev => [newWh, ...prev]);
    soundEffects.playPixSuccess();
  };

  // Handle access from login entry screen
  const handleAccessFromOnboarding = () => {
    requestBiometric('Acessar LeadsPay Bank', () => {
      setCurrentScreen('bank');
      setActiveTab('dashboard');
    });
  };

  // Handle account created from registration modal
  const handleAccountCreated = (newName: string, newEmail: string) => {
    setUserProfile(prev => ({
      ...prev,
      name: newName,
      pixKeys: [
        ...prev.pixKeys,
        { type: 'email', value: newEmail }
      ]
    }));
    setCurrentScreen('bank');
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-[#00e676] selection:text-black">
      {/* Push Notification Toast */}
      <NotificationToast
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {/* Screen 1: EXACT Entry Screen from User Image */}
      {currentScreen === 'onboarding' ? (
        <div className="w-full min-h-screen flex items-center justify-center bg-black">
          <div className="w-full max-w-md h-full min-h-[100dvh] sm:h-[880px] sm:min-h-0 sm:max-h-[920px] sm:rounded-[44px] shadow-2xl relative overflow-hidden bg-black flex flex-col justify-between sm:border sm:border-white/10">
            <LoginEntryView
              onAccessAccount={handleAccessFromOnboarding}
              onOpenRegister={() => setIsOpenAccountModalOpen(true)}
              onOpenQuickPix={() => {
                setCurrentScreen('bank');
                setIsPixModalOpen(true);
              }}
              onOpenSupport={() => setIsSupportOpen(true)}
              onOpenToken={() => setIsTokenModalOpen(true)}
            />
          </div>
        </div>
      ) : (
        /* Screen 2: Responsive Banking Experience */
        <div className={`w-full transition-all duration-300 flex flex-col min-h-screen ${
          isMobileFrame 
            ? 'max-w-[420px] my-4 rounded-[44px] border-[5px] border-[#18261e] shadow-[0_0_80px_rgba(0,230,118,0.2)] overflow-hidden' 
            : 'max-w-2xl sm:max-w-3xl lg:max-w-4xl'
        }`}>
          {/* Top Header */}
          <HeaderBar
            userProfile={userProfile}
            showBalance={showBalance}
            onToggleBalance={() => setShowBalance(!showBalance)}
            onOpenSecurity={() => setIsSecurityOpen(true)}
            onOpenSupport={() => setIsSupportOpen(true)}
            onLogout={() => setCurrentScreen('onboarding')}
            isMobileFrame={isMobileFrame}
            onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          />

          {/* Main Content Area with Fluid Transitions and bottom padding for the floating navigation dock */}
          <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-28 sm:pb-32 w-full">
            <AnimatePresence mode="wait">
              {/* TAB 1: CONTA (Dashboard) */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DashboardView
                    userProfile={userProfile}
                    showBalance={showBalance}
                    transactions={transactions}
                    cards={cards}
                    onOpenPix={() => setIsPixModalOpen(true)}
                    onOpenTapToPay={() => setIsTapToPayOpen(true)}
                    onOpenCards={() => setActiveTab('cards')}
                    onOpenExtrato={() => setActiveTab('extrato')}
                    onOpenFinance={() => setActiveTab('finance')}
                    onOpenDevApi={() => setActiveTab('devapi')}
                    onOpenSecurity={() => setIsSecurityOpen(true)}
                  />
                </motion.div>
              )}

              {/* TAB 2: VENDAS (Extrato Detalhado & Vendas) */}
              {activeTab === 'extrato' && (
                <motion.div
                  key="extrato"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.22 }}
                >
                  <ExtratoView
                    transactions={transactions}
                    onBackToDashboard={() => setActiveTab('dashboard')}
                  />
                </motion.div>
              )}

              {/* TAB 3: CARTÕES (Virtual & Físico) */}
              {activeTab === 'cards' && (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardsView
                    cards={cards}
                    onToggleFreeze={handleToggleFreeze}
                    onUpdateLimit={handleUpdateLimit}
                    onCreateVirtualCard={handleCreateVirtualCard}
                    onRequestBiometric={requestBiometric}
                  />
                </motion.div>
              )}

              {/* TAB 4: AJUSTES (Settings, Finance, Security, API, Support) */}
              {activeTab === 'ajustes' && (
                <motion.div
                  key="ajustes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AjustesView
                    userProfile={userProfile}
                    onOpenFinance={() => setActiveTab('finance')}
                    onOpenDevApi={() => setActiveTab('devapi')}
                    onOpenSecurity={() => setIsSecurityOpen(true)}
                    onOpenSupport={() => setIsSupportOpen(true)}
                    onOpenPix={() => setIsPixModalOpen(true)}
                    onLogout={() => setCurrentScreen('onboarding')}
                  />
                </motion.div>
              )}

              {/* SUB-VIEW: GESTÃO FINANCEIRA */}
              {activeTab === 'finance' && (
                <motion.div
                  key="finance"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>← Voltar para Conta</span>
                    </button>
                  </div>
                  <FinancialManagementView
                    categories={categories}
                    transactions={transactions}
                    balance={userProfile.balance}
                  />
                </motion.div>
              )}

              {/* SUB-VIEW: DEV API & WEBHOOKS */}
              {activeTab === 'devapi' && (
                <motion.div
                  key="devapi"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>← Voltar para Conta</span>
                    </button>
                  </div>
                  <DeveloperApiView
                    apiKeys={apiKeys}
                    webhooks={webhooks}
                    onGenerateKey={handleGenerateKey}
                    onAddWebhook={handleAddWebhook}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Floating Pill Bottom Navigation Bar */}
          <BottomNavBar
            currentTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenLeadsTap={() => setIsTapToPayOpen(true)}
          />
        </div>
      )}

      {/* Global Interactive Feature Modals */}
      {/* 1. Pix Modal */}
      <PixModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        userProfile={userProfile}
        onNewTransaction={handleNewTransaction}
        onRequestBiometric={requestBiometric}
      />

      {/* 2. LeadsTap Contactless Payment Modal */}
      <LeadsTapModal
        isOpen={isTapToPayOpen}
        onClose={() => setIsTapToPayOpen(false)}
        onNewTransaction={handleNewTransaction}
      />

      {/* 3. 24/7 Live Support Chat */}
      <Support247Chat
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* 4. Security Center & Knox Protection */}
      <SecurityCenterModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        userProfile={userProfile}
        onToggleStreetProtection={() => {
          setUserProfile(prev => ({ ...prev, streetProtectionMode: !prev.streetProtectionMode }));
        }}
        onToggleBiometrics={() => {
          setUserProfile(prev => ({ ...prev, biometricEnabled: !prev.biometricEnabled }));
        }}
        onRequestBiometric={requestBiometric}
      />

      {/* 5. Biometric Laser Scanner Modal */}
      <BiometricAuthModal
        isOpen={biometricConfig.isOpen}
        title={biometricConfig.title}
        reason={biometricConfig.reason}
        onSuccess={biometricConfig.onVerified}
        onCancel={() => setBiometricConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 6. Dynamic Knox Security Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      {/* 7. Open Account Modal */}
      <OpenAccountModal
        isOpen={isOpenAccountModalOpen}
        onClose={() => setIsOpenAccountModalOpen(false)}
        onAccountCreated={handleAccountCreated}
      />
    </div>
  );
}
