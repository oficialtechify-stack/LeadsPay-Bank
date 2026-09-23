import React, { useState, useEffect } from 'react';
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
import { AccessAccountModal } from './components/AccessAccountModal';
import { AdminReviewModal } from './components/AdminReviewModal';
import { NotificationToast, BankNotification } from './components/NotificationToast';
import { 
  initialUserProfile, 
  initialTransactions, 
  initialVirtualCards, 
  initialFinancialCategories, 
  initialApiKeys, 
  initialWebhooks 
} from './data/mockData';
import { Transaction, VirtualCard, DeveloperApiKey, WebhookConfig, UserProfile } from './types';
import { soundEffects } from './utils/audio';
import {
  auth,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  db
} from './firebase/config';
import {
  signInWithGoogle,
  logOut,
  subscribeToUserAccount,
  recordTransaction,
  saveCard,
  updateUserProfile as updateUserProfileInDb,
  createInitialUserProfile,
  createDefaultVirtualCard,
  getLocalUserProfile,
  saveLocalUserProfile,
  saveLocalCards
} from './services/firebaseBankService';

export default function App() {
  // Screen and Tab state: starts at the exact entry screen requested
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'bank'>('onboarding');
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Core bank data state
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
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
  const [isAccessAccountModalOpen, setIsAccessAccountModalOpen] = useState(false);
  const [isAdminReviewModalOpen, setIsAdminReviewModalOpen] = useState(false);
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

  // Real-time Firebase Authentication & per-user individual Firestore synchronization
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 1. Immediately provide individual user profile (from local cache or fresh creation)
        let profile = getLocalUserProfile(currentUser.uid);
        if (profile) {
          profile.balance = Math.max(0, profile.balance || 0);
        }
        if (!profile) {
          profile = createInitialUserProfile({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          });
          saveLocalUserProfile(currentUser.uid, profile);
          const initialCard = createDefaultVirtualCard(currentUser.uid, profile.name);
          saveLocalCards(currentUser.uid, [initialCard]);
        }
        setUserProfile(profile);

        // 2. Subscribe to real-time updates (loads local cache first, then syncs with cloud)
        if (unsubscribeFirestore) unsubscribeFirestore();
        unsubscribeFirestore = subscribeToUserAccount(currentUser.uid, {
          onProfile: (updatedProfile) => {
            setUserProfile(prev => ({
              ...prev,
              ...updatedProfile,
              balance: Math.max(0, updatedProfile.balance || 0),
              uid: currentUser.uid
            }));
          },
          onTransactions: (updatedTxs) => {
            setTransactions(updatedTxs);
          },
          onCards: (updatedCards) => {
            if (updatedCards.length > 0) {
              setCards(updatedCards);
            }
          }
        });

        // 3. Try to ensure Firestore cloud document exists in background
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            await setDoc(userDocRef, profile);
            const initialCard = createDefaultVirtualCard(currentUser.uid, profile.name);
            await setDoc(doc(db, 'users', currentUser.uid, 'cards', initialCard.id), initialCard);
          } else {
            const data = docSnap.data() as UserProfile;
            data.uid = currentUser.uid;
            saveLocalUserProfile(currentUser.uid, data);
            setUserProfile(data);
          }
        } catch (err) {
          console.warn('Firestore cloud sync notice (operating in local individual mode):', err);
        }

        setCurrentScreen('bank');
      } else {
        // Clean up Firestore listener on logout
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

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

  // Google Sign-in Handler
  const handleGoogleSignIn = async () => {
    try {
      const { user, profile } = await signInWithGoogle();
      setUserProfile(profile);
      setCurrentScreen('bank');
      setActiveTab('dashboard');
      soundEffects.playPixSuccess();
      setNotification({
        id: Date.now().toString(),
        title: 'Conta Conectada!',
        message: `Bem-vindo, ${user.displayName || user.email}! Seus dados estão seguros no Firebase.`,
        type: 'pix'
      });
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      if (authError?.code !== 'auth/popup-closed-by-user') {
        console.error('Google Sign-In Error:', err);
        throw err;
      }
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Error logging out:', err);
    }
    setCurrentScreen('onboarding');
    setActiveTab('dashboard');
    setUserProfile(initialUserProfile);
    setTransactions([]);
    setNotification({
      id: Date.now().toString(),
      title: 'Sessão Encerrada',
      message: 'Você saiu da sua conta LeadsPay com segurança.',
      type: 'card'
    });
  };

  // Handle New Transaction (Pix, Tap to Pay, Card)
  const handleNewTransaction = async (newTx: Transaction) => {
    const currentUid = auth.currentUser?.uid || userProfile.uid;
    const currentBalance = Math.max(0, userProfile.balance || 0);
    const nextBalance = Math.max(0, currentBalance + newTx.amount);

    if (currentUid) {
      try {
        await recordTransaction(currentUid, newTx, currentBalance);
      } catch (err) {
        console.error('Failed to record transaction to Firestore:', err);
        // Optimistic fallback
        setTransactions(prev => [newTx, ...prev]);
        setUserProfile(prev => ({ ...prev, balance: nextBalance }));
      }
    } else {
      setTransactions(prev => [newTx, ...prev]);
      setUserProfile(prev => ({
        ...prev,
        balance: nextBalance
      }));
    }

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
  const handleToggleFreeze = async (cardId: string) => {
    const currentUid = auth.currentUser?.uid || userProfile.uid;
    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard) return;

    const nextState = !targetCard.isFrozen;
    const updatedCard: VirtualCard = { ...targetCard, isFrozen: nextState };

    if (currentUid) {
      try {
        await saveCard(currentUid, updatedCard);
      } catch (err) {
        console.error('Failed to update card freeze in Firestore:', err);
      }
    }

    setCards(prev => prev.map(c => (c.id === cardId ? updatedCard : c)));
    setNotification({
      id: Date.now().toString(),
      title: nextState ? 'Cartão Bloqueado' : 'Cartão Desbloqueado',
      message: `${targetCard.name} foi ${nextState ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      type: 'card'
    });
  };

  // Card Limit Update
  const handleUpdateLimit = async (cardId: string, newLimit: number) => {
    const currentUid = auth.currentUser?.uid || userProfile.uid;
    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard) return;

    const updatedCard: VirtualCard = { ...targetCard, limit: newLimit };

    if (currentUid) {
      try {
        await saveCard(currentUid, updatedCard);
      } catch (err) {
        console.error('Failed to update card limit in Firestore:', err);
      }
    }

    setCards(prev => prev.map(c => (c.id === cardId ? updatedCard : c)));
    setNotification({
      id: Date.now().toString(),
      title: 'Limite Atualizado',
      message: `Novo limite de R$ ${newLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} definido.`,
      type: 'card'
    });
  };

  // Create Virtual Card
  const handleCreateVirtualCard = async (name: string, category: VirtualCard['category']) => {
    const currentUid = auth.currentUser?.uid || userProfile.uid;
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

    if (currentUid) {
      try {
        await saveCard(currentUid, newCard);
      } catch (err) {
        console.error('Failed to save virtual card to Firestore:', err);
      }
    }

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

  // Handle manual or biometric access from access modal
  const handleManualAccess = (identifier: string) => {
    requestBiometric('Acessar LeadsPay Bank', () => {
      if (identifier && identifier !== 'Biometria') {
        setUserProfile(prev => ({
          ...prev,
          name: identifier.includes('@') ? identifier.split('@')[0] : prev.name
        }));
      }
      setCurrentScreen('bank');
      setActiveTab('dashboard');
    });
  };

  // Handle access from login entry screen
  const handleAccessFromOnboarding = () => {
    setIsAccessAccountModalOpen(true);
  };

  // Handle account created from registration modal
  const handleAccountCreated = async (newName: string, newEmail: string, cpf?: string, phone?: string) => {
    const currentUid = auth.currentUser?.uid || `user-${Date.now()}`;
    const newProfile: UserProfile = {
      uid: currentUid,
      name: newName,
      email: newEmail,
      document: cpf || '000.***.***-00',
      accountNumber: `${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(1 + Math.random() * 9)}`,
      agency: '0001',
      bankCode: '592 - LeadsPay S.A.',
      balance: 0.00,
      investedBalance: 0.00,
      pixKeys: [
        { type: 'email', value: newEmail },
        { type: 'phone', value: phone || '+55 11 98842-7719' },
        { type: 'random', value: `lp-${Math.random().toString(36).substring(2, 8)}` }
      ],
      biometricEnabled: true,
      streetProtectionMode: false,
      dailyPixLimit: 10000.00,
      nightlyPixLimit: 1000.00
    };

    setUserProfile(newProfile);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), newProfile);
      } catch (err) {
        console.error('Failed to save user profile to Firestore:', err);
      }
    }

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
            onLogout={handleLogout}
            isMobileFrame={isMobileFrame}
            onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
            onOpenAdminReview={() => setIsAdminReviewModalOpen(true)}
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
                    onLogout={handleLogout}
                    onOpenAdminReview={() => setIsAdminReviewModalOpen(true)}
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
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      ← Voltar para Minha Conta
                    </button>
                  </div>
                  <FinancialManagementView
                    categories={categories}
                    transactions={transactions}
                    balance={userProfile.balance}
                  />
                </motion.div>
              )}

              {/* SUB-VIEW: API DEVELOPER PORTAL */}
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
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      ← Voltar para Minha Conta
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

          {/* Floating Mobile Bottom Navigation Dock */}
          <BottomNavBar
            currentTab={activeTab}
            onSelectTab={(tab: MainTab) => setActiveTab(tab)}
            onOpenLeadsTap={() => setIsTapToPayOpen(true)}
          />
        </div>
      )}

      {/* GLOBAL MODALS */}

      {/* 1. Pix Modal (Instant transfers, QR Code, Receive, Key Management) */}
      <PixModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        userProfile={userProfile}
        onNewTransaction={handleNewTransaction}
        onRequestBiometric={requestBiometric}
      />

      {/* 2. LeadsTap Contactless Tap-to-Pay on Phone (Point-of-Sale) */}
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
          const nextVal = !userProfile.streetProtectionMode;
          setUserProfile(prev => ({ ...prev, streetProtectionMode: nextVal }));
          if (auth.currentUser) {
            updateUserProfileInDb(auth.currentUser.uid, { streetProtectionMode: nextVal }).catch(console.error);
          }
        }}
        onToggleBiometrics={() => {
          const nextVal = !userProfile.biometricEnabled;
          setUserProfile(prev => ({ ...prev, biometricEnabled: nextVal }));
          if (auth.currentUser) {
            updateUserProfileInDb(auth.currentUser.uid, { biometricEnabled: nextVal }).catch(console.error);
          }
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

      {/* 7. Access Account Modal (Login with Google or credentials) */}
      <AccessAccountModal
        isOpen={isAccessAccountModalOpen}
        onClose={() => setIsAccessAccountModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onManualAccess={handleManualAccess}
        onOpenRegister={() => {
          setIsAccessAccountModalOpen(false);
          setIsOpenAccountModalOpen(true);
        }}
      />

      {/* 8. Open Account Modal with Google Sign-in & Registration */}
      <OpenAccountModal
        isOpen={isOpenAccountModalOpen}
        onClose={() => setIsOpenAccountModalOpen(false)}
        onAccountCreated={handleAccountCreated}
        onGoogleSignIn={handleGoogleSignIn}
        onOpenLogin={() => {
          setIsOpenAccountModalOpen(false);
          setIsAccessAccountModalOpen(true);
        }}
      />

      {/* 9. Admin Review & KYC Compliance Portal (Exclusive to rickmarketing81@gmail.com) */}
      <AdminReviewModal
        isOpen={isAdminReviewModalOpen}
        onClose={() => setIsAdminReviewModalOpen(false)}
        currentUserEmail={userProfile.email || auth.currentUser?.email}
        onApplicationApproved={(app) => {
          if (auth.currentUser && app.userId === auth.currentUser.uid) {
            setUserProfile(prev => ({
              ...prev,
              name: app.fullName,
              preferredName: app.preferredName,
              document: app.cpf,
              birthDate: app.birthDate,
              status: 'approved'
            }));
          }
        }}
      />
    </div>
  );
}
