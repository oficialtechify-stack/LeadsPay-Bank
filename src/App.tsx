import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LoginEntryView } from './components/LoginEntryView';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar } from './components/BottomNavBar';
import { TopPillTabs } from './components/ui';
import { SoonView } from './components/SoonView';
import type { Route } from './lib/routes';
import { activeTopTab } from './lib/routes';
import { VendasView } from './components/VendasView';
import { NegocioView } from './components/NegocioView';
import { MoedasView } from './components/MoedasView';
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
import { PendingApprovalModal } from './components/PendingApprovalModal';
import { NotificationToast, BankNotification } from './components/NotificationToast';
import { 
  initialUserProfile, 
  initialTransactions, 
  initialVirtualCards, 
  initialFinancialCategories, 
  initialApiKeys, 
  initialWebhooks 
} from './data/mockData';
import { Transaction, VirtualCard, DeveloperApiKey, WebhookConfig, UserProfile, AccountApplication } from './types';
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
  generateCardExpiry,
  generateAccountNumber,
  getLocalUserProfile,
  getLocalCards,
  saveLocalUserProfile,
  saveLocalCards,
  ADMIN_EMAIL,
  findApplicationByEmailOrCpf,
  findUserProfileByEmailOrCpf,
  getLocalUserApplication,
  saveRegistrationDraft,
  clearRegistrationDraft,
  markLocalProfileApproved
} from './services/firebaseBankService';

export default function App() {
  // Screen and route state: starts at the exact entry screen requested
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'bank'>('onboarding');
  // Roteamento por Route (§4 do plano v2; Q-nav1 = B, Q1 = Ajustes).
  // Fase B: as 4 abas (Conta/Vendas/Negocio/Moedas) existem — Conta compõe
  // sobre o DashboardView; Vendas, Negócio e Moedas têm views próprias.
  const [route, setRoute] = useState<Route>({ name: 'conta' });
  const [pixInitialTab, setPixInitialTab] = useState<'send' | 'receive' | 'keys' | 'limits'>('send');
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
  const [isPendingApprovalModalOpen, setIsPendingApprovalModalOpen] = useState(false);
  const [pendingApp, setPendingApp] = useState<AccountApplication | null>(null);
  const [openAccountPrefill, setOpenAccountPrefill] = useState<{ email?: string; cpf?: string } | undefined>(undefined);
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

  // Navegação por Route. 'pix' e 'tap' são modais no Bank: 'pix' abre o
  // PixModal (aba definida por pixInitialTab) sem trocar a rota; 'tap'
  // abre o LeadsTapModal a partir da aba Vendas (Q-nav1 = B).
  const navigate = (next: Route) => {
    if (next.name === 'pix') {
      setPixInitialTab('receive');
      setIsPixModalOpen(true);
      return;
    }
    if (next.name === 'tap') {
      setRoute({ name: 'vendas' });
      setIsTapToPayOpen(true);
      return;
    }
    setRoute(next);
  };

  // Real-time Firebase Authentication & per-user individual Firestore synchronization
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userEmail = currentUser.email?.toLowerCase().trim() || '';
        const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

        // 1. Super Admin (rickmarketing81@gmail.com) has instant access to administration and dashboard
        if (isAdmin) {
          let profile = getLocalUserProfile(currentUser.uid);
          if (profile) {
            profile.balance = Math.max(0, profile.balance || 0);
          }
          if (!profile) {
            profile = createInitialUserProfile({
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Administrador LeadsPay',
              email: currentUser.email || ADMIN_EMAIL,
              photoURL: currentUser.photoURL
            });
            saveLocalUserProfile(currentUser.uid, profile);
          }
          clearRegistrationDraft();
          setUserProfile(profile);
          // §7.1 caminho 3: o ramo admin nunca assinava o Firestore, então
          // os cards ficavam no inicial semeado. O cartão do admin vem de
          // createDefaultVirtualCard com o nome real (ou do local, se já
          // existir) — nunca do estado inicial.
          const adminLocalCards = getLocalCards(currentUser.uid);
          if (adminLocalCards.length > 0) {
            setCards(adminLocalCards);
          } else {
            const adminCard = createDefaultVirtualCard(currentUser.uid, profile.name);
            saveLocalCards(currentUser.uid, [adminCard]);
            setCards([adminCard]);
          }
          setCurrentScreen('bank');
          return;
        }

        // 2. Regular user verification: "nunca crie uma conta sem validacao da administracao"
        const existingApp = getLocalUserApplication(currentUser.uid) || 
                            (userEmail ? findApplicationByEmailOrCpf(userEmail) : null);
        const existingProfile = getLocalUserProfile(currentUser.uid);

        // A. Aprovado pelo administrador — ou conta existente de antes do
        // sistema de aprovação (sem carimbo de status): perfil existente
        // vale como conta válida e é carimbado na hora, em vez de cair no
        // questionário de criar conta.
        const approvedProfile = existingProfile ? markLocalProfileApproved(existingProfile) : null;
        if (existingApp?.status === 'approved' || approvedProfile) {
          let profile = approvedProfile || createInitialUserProfile({
            uid: currentUser.uid,
            displayName: existingApp?.fullName || currentUser.displayName || 'Cliente LeadsPay',
            email: currentUser.email || existingApp?.email || '',
            photoURL: existingApp?.selfiePhoto || currentUser.photoURL
          });
          profile.balance = Math.max(0, profile.balance || 0);
          profile.status = 'approved';
          clearRegistrationDraft();
          setUserProfile(profile);

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
            onTransactions: (updatedTxs) => setTransactions(updatedTxs),
            onCards: (updatedCards) => {
              if (updatedCards.length > 0) setCards(updatedCards);
            }
          });

          setCurrentScreen('bank');
        } else if (existingApp) {
          // B. Proposal exists and is pending or needs revision: Keep on entry screen and show pending notice!
          setCurrentScreen('onboarding');
          setPendingApp(existingApp);
          setIsPendingApprovalModalOpen(true);
        } else {
          // C. User has NO account: send to open account flow with draft pre-filled!
          setCurrentScreen('onboarding');
          saveRegistrationDraft({
            fullName: currentUser.displayName || '',
            preferredName: currentUser.displayName?.split(' ')[0] || '',
            email: userEmail,
            selfiePhoto: currentUser.photoURL || ''
          });
          setOpenAccountPrefill({ email: userEmail });
          setIsOpenAccountModalOpen(true);
        }
      } else {
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
      const { user } = await signInWithGoogle();
      const userEmail = user.email?.toLowerCase().trim() || '';
      const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

      if (isAdmin) {
        let adminProf = getLocalUserProfile(user.uid);
        if (!adminProf) {
          adminProf = createInitialUserProfile({
            uid: user.uid,
            displayName: user.displayName || 'Administrador LeadsPay',
            email: user.email || ADMIN_EMAIL,
            photoURL: user.photoURL
          });
          saveLocalUserProfile(user.uid, adminProf);
        }
        clearRegistrationDraft();
        setUserProfile(adminProf);
        // §7.1 caminho 3 (mesmo tratamento do ramo admin do onAuthStateChanged).
        const adminLocalCards = getLocalCards(user.uid);
        if (adminLocalCards.length > 0) {
          setCards(adminLocalCards);
        } else {
          const adminCard = createDefaultVirtualCard(user.uid, adminProf.name);
          saveLocalCards(user.uid, [adminCard]);
          setCards([adminCard]);
        }
        setCurrentScreen('bank');
        setRoute({ name: 'conta' });
        soundEffects.playPixSuccess();
        return;
      }

      // Check application status
      const app = (user.uid ? getLocalUserApplication(user.uid) : null) || 
                  (userEmail ? findApplicationByEmailOrCpf(userEmail) : null);

      if (app) {
        if (app.status === 'approved') {
          clearRegistrationDraft();
          const profile = getLocalUserProfile(user.uid) || getLocalUserProfile(app.userId);
          if (profile) {
            setUserProfile(markLocalProfileApproved(profile));
            setCurrentScreen('bank');
            setRoute({ name: 'conta' });
            soundEffects.playPixSuccess();
          }
        } else {
          // Status is pending or needs revision
          setPendingApp(app);
          setIsPendingApprovalModalOpen(true);
        }
      } else if (getLocalUserProfile(user.uid) || (userEmail ? findUserProfileByEmailOrCpf(userEmail) : null)) {
        // Conta existente sem proposta: perfil criado antes do sistema de
        // aprovação vale como conta válida (carimba na hora, em vez de
        // mandar p/ o questionário de criar conta).
        const profile = getLocalUserProfile(user.uid) || findUserProfileByEmailOrCpf(userEmail)!;
        clearRegistrationDraft();
        setUserProfile(markLocalProfileApproved(profile));
        setCurrentScreen('bank');
        setRoute({ name: 'conta' });
        soundEffects.playPixSuccess();
      } else {
        // Never create account without admin validation!
        // Limpa o rascunho velho antes de pré-preencher: sem isso o merge
        // ressuscita os dados da tentativa anterior de criar conta.
        clearRegistrationDraft();
        saveRegistrationDraft({
          fullName: user.displayName || '',
          preferredName: user.displayName?.split(' ')[0] || '',
          email: userEmail,
          selfiePhoto: user.photoURL || ''
        });
        setOpenAccountPrefill({ email: userEmail });
        setIsOpenAccountModalOpen(true);
        setNotification({
          id: Date.now().toString(),
          title: 'Cadastro Necessário',
          message: 'Conectado com o Google! Agora preencha seus dados e fotos para validação da sua conta.',
          type: 'card'
        });
      }
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
    setRoute({ name: 'conta' });
    // §7.1 caminho 5: o logout reseta para o inicial NEUTRALIZADO — e o
    // estado de cartões/categorias/chaves também volta ao inicial, para
    // nenhuma reentrada (ex.: atalho "Área Pix") reexpor dado do usuário
    // anterior.
    setUserProfile(initialUserProfile);
    setTransactions([]);
    setCards(initialVirtualCards);
    setCategories(initialFinancialCategories);
    setApiKeys(initialApiKeys);
    setWebhooks(initialWebhooks);
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

    // If it's a Tap to Pay SALE, update the Vendas category — a Tap PAYMENT
    // (Q12: negative amount) is an outflow, never a sale, and must not
    // reduce (or inflate) the Vendas total.
    if (newTx.type === 'tap_to_pay' && newTx.amount > 0) {
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
      title: newTx.type === 'tap_to_pay'
        ? (newTx.amount > 0 ? 'Venda LeadsTap Aprovada!' : 'Pagamento LeadsTap Realizado!')
        : 'Transação Realizada!',
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
      expiry: generateCardExpiry(),
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
  const handleManualAccess = (profileOrIdentifier?: UserProfile | string) => {
    clearRegistrationDraft();
    if (typeof profileOrIdentifier === 'object' && profileOrIdentifier !== null) {
      setUserProfile(markLocalProfileApproved(profileOrIdentifier));
      setCurrentScreen('bank');
      setRoute({ name: 'conta' });
      soundEffects.playPixSuccess();
      return;
    }

    // §7.1 caminho 1: o modal chama onManualAccess() sem argumento quando
    // acha uma proposta aprovada mas nenhum perfil local (o lookup era
    // quebrado, §7.9). Sem perfil resolvido, só entra se o estado atual já
    // for um perfil real carregado (tem uid). O perfil inicial neutro nunca
    // pode ser renderizado após navegação pós-login — e, sem identificador
    // aqui, não há como resolver o perfil: fica na login com aviso.
    if (!userProfile.uid) {
      setNotification({
        id: Date.now().toString(),
        title: 'Conta não encontrada neste aparelho',
        message: 'Não localizamos sua conta. Acesse com o Google ou abra uma conta.',
        type: 'card'
      });
      return;
    }

    requestBiometric('Acessar LeadsPay Bank', () => {
      if (typeof profileOrIdentifier === 'string' && profileOrIdentifier !== 'Biometria') {
        setUserProfile(prev => ({
          ...prev,
          name: profileOrIdentifier.includes('@') ? profileOrIdentifier.split('@')[0] : prev.name
        }));
      }
      setCurrentScreen('bank');
      setRoute({ name: 'conta' });
    });
  };

  // Q13=(A): "Salvar Novos Limites" persiste de verdade — estado local +
  // updateUserProfile (localStorage + Firestore). Sem ele, reabrir o modal
  // restaurava os valores do perfil (§7.14).
  const handleSavePixLimits = (daily: number, nightly: number) => {
    setUserProfile(prev => ({ ...prev, dailyPixLimit: daily, nightlyPixLimit: nightly }));
    const uid = auth.currentUser?.uid || userProfile.uid;
    if (uid) {
      updateUserProfileInDb(uid, { dailyPixLimit: daily, nightlyPixLimit: nightly }).catch(console.error);
    }
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
    setRoute({ name: 'conta' });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col items-center justify-start antialiased selection:bg-[#00e676] selection:text-black">
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
              onGoogleSignIn={handleGoogleSignIn}
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
          {/* Top Header — rola para fora; só as pílulas ficam fixas (§4.5, R4) */}
          <HeaderBar
            userProfile={userProfile}
            showBalance={showBalance}
            onToggleBalance={() => setShowBalance(!showBalance)}
            onOpenNotifications={() =>
              navigate({
                name: 'soon',
                title: 'Notificações',
                reason:
                  'As notificações do app ainda não existem. Por enquanto, os avisos aparecem como mensagens na tela.',
                backTo: route,
              })
            }
            onOpenPixReceive={() => {
              setPixInitialTab('receive');
              setIsPixModalOpen(true);
            }}
            onOpenSupport={() => setIsSupportOpen(true)}
            onLogout={handleLogout}
            onOpenAdminReview={() => setIsAdminReviewModalOpen(true)}
          />

          {/* Pílulas do topo — fixas; ativa é nula em rota interna (§4) */}
          <TopPillTabs
            active={activeTopTab(route)}
            onSelect={(tab) => navigate({ name: tab })}
          />

          {/* Main Content Area with Fluid Transitions and bottom padding for the floating navigation dock */}
          <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-28 sm:pb-32 w-full">
            <AnimatePresence mode="wait">
              {/* ABA CONTA (Dashboard) */}
              {route.name === 'conta' && (
                <motion.div
                  key="conta"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DashboardView
                    userProfile={userProfile}
                    showBalance={showBalance}
                    transactions={transactions}
                    onOpenPix={() => {
                      setPixInitialTab('send');
                      setIsPixModalOpen(true);
                    }}
                    onOpenPixReceive={() => {
                      setPixInitialTab('receive');
                      setIsPixModalOpen(true);
                    }}
                    onOpenPixKeys={() => {
                      setPixInitialTab('keys');
                      setIsPixModalOpen(true);
                    }}
                    onOpenPixLimits={() => {
                      setPixInitialTab('limits');
                      setIsPixModalOpen(true);
                    }}
                    onOpenTapToPay={() => setIsTapToPayOpen(true)}
                    onOpenCards={() => navigate({ name: 'cartao' })}
                    onOpenExtrato={() => navigate({ name: 'extrato' })}
                    onOpenFinance={() => navigate({ name: 'gestao' })}
                    onOpenDevApi={() => navigate({ name: 'api' })}
                    onOpenSecurity={() => setIsSecurityOpen(true)}
                    onOpenSupport={() => setIsSupportOpen(true)}
                    onOpenToken={() => setIsTokenModalOpen(true)}
                    onOpenAdminReview={() => setIsAdminReviewModalOpen(true)}
                    isAdmin={userProfile.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()}
                  />
                </motion.div>
              )}

              {/* ABA VENDAS — VendasView (fase B, §4.2): vendas de hoje
                  derivadas de transactions; o ExtratoView inteiro vive
                  como rota interna `extrato` */}
              {route.name === 'vendas' && (
                <motion.div
                  key="vendas"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <VendasView
                    transactions={transactions}
                    showBalance={showBalance}
                    onNavigate={navigate}
                  />
                </motion.div>
              )}

              {/* ABA MEU NEGÓCIO — NegocioView (fase B, §4.3): só Gestão,
                  Rendimentos e API; nada de clientes/site/catálogo/agenda */}
              {route.name === 'negocio' && (
                <motion.div
                  key="negocio"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <NegocioView
                    investedBalance={userProfile.investedBalance}
                    showBalance={showBalance}
                    onNavigate={navigate}
                  />
                </motion.div>
              )}

              {/* ABA MOEDAS — MoedasView (fase B, §4.4, Q3=(a)): missões
                  derivadas de transactions; conta nova = 0 moedas */}
              {route.name === 'moedas' && (
                <motion.div
                  key="moedas"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <MoedasView transactions={transactions} />
                </motion.div>
              )}

              {/* ROTA INTERNA: EXTRATO (pai = Vendas) */}
              {route.name === 'extrato' && (
                <motion.div
                  key="extrato"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.22 }}
                >
                  <ExtratoView
                    transactions={transactions}
                    onBackToDashboard={() => navigate({ name: 'vendas' })}
                  />
                </motion.div>
              )}

              {/* ROTA INTERNA: CARTÃO (pai = Conta) */}
              {route.name === 'cartao' && (
                <motion.div
                  key="cartao"
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

              {/* ROTA INTERNA: AJUSTES (pai = Conta) */}
              {route.name === 'ajustes' && (
                <motion.div
                  key="ajustes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AjustesView
                    userProfile={userProfile}
                    onOpenFinance={() => navigate({ name: 'gestao' })}
                    onOpenDevApi={() => navigate({ name: 'api' })}
                    onOpenSecurity={() => setIsSecurityOpen(true)}
                    onOpenSupport={() => setIsSupportOpen(true)}
                    onOpenPix={() => {
                      setPixInitialTab('send');
                      setIsPixModalOpen(true);
                    }}
                    onLogout={handleLogout}
                    onOpenAdminReview={() => setIsAdminReviewModalOpen(true)}
                    isMobileFrame={isMobileFrame}
                    onToggleMobileFrame={() => setIsMobileFrame((v) => !v)}
                  />
                </motion.div>
              )}

              {/* ROTA INTERNA: GESTÃO FINANCEIRA (pai = Meu Negócio — §4) */}
              {route.name === 'gestao' && (
                <motion.div
                  key="gestao"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => navigate({ name: 'negocio' })}
                      className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
                    >
                      ← Voltar para Meu Negócio
                    </button>
                  </div>
                  <FinancialManagementView
                    categories={categories}
                    transactions={transactions}
                    balance={userProfile.balance}
                  />
                </motion.div>
              )}

              {/* ROTA INTERNA: API DEVELOPER PORTAL (pai = Meu Negócio — §4) */}
              {route.name === 'api' && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => navigate({ name: 'negocio' })}
                      className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
                    >
                      ← Voltar para Meu Negócio
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

              {/* ROTA INTERNA: SOONVIEW (pai = rota de origem) */}
              {route.name === 'soon' && (
                <motion.div
                  key="soon"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SoonView
                    title={route.title}
                    reason={route.reason}
                    onBack={navigate}
                    backTo={route.backTo}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Floating Mobile Bottom Navigation Dock */}
          <BottomNavBar route={route} onNavigate={navigate} />
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
        onSavePixLimits={handleSavePixLimits}
        initialTab={pixInitialTab}
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
        onOpenRegister={(prefill) => {
          setOpenAccountPrefill(prefill);
          setIsAccessAccountModalOpen(false);
          setIsOpenAccountModalOpen(true);
        }}
        onShowPendingApproval={(app) => {
          setPendingApp(app);
          setIsAccessAccountModalOpen(false);
          setIsPendingApprovalModalOpen(true);
        }}
      />

      {/* 8. Open Account Modal with Google Sign-in & Registration */}
      <OpenAccountModal
        isOpen={isOpenAccountModalOpen}
        onClose={() => {
          setIsOpenAccountModalOpen(false);
          setOpenAccountPrefill(undefined);
        }}
        initialIdentifier={openAccountPrefill}
        onAccountCreated={handleAccountCreated}
        onGoogleSignIn={handleGoogleSignIn}
        onOpenLogin={() => {
          setIsOpenAccountModalOpen(false);
          setIsAccessAccountModalOpen(true);
        }}
        onApplicationSubmitted={(app) => {
          setPendingApp(app);
        }}
      />

      {/* 8b. Pending Approval Screen (Aguarde a aprovação da sua conta) */}
      <PendingApprovalModal
        isOpen={isPendingApprovalModalOpen}
        onClose={() => setIsPendingApprovalModalOpen(false)}
        application={pendingApp}
        onOpenRevision={(app) => {
          setIsPendingApprovalModalOpen(false);
          setIsOpenAccountModalOpen(true);
        }}
        onApprovedLogin={(app) => {
          setIsPendingApprovalModalOpen(false);
          // §7.1 caminho 2: o fallback antigo espalhava o perfil inicial
          // (`{...userProfile, name, document, email}`) e mantinha conta e
          // pixKeys de terceiro. Sem perfil local, o perfil é construído SÓ
          // com os dados reais da proposta aprovada — mesma origem de
          // approveApplicationAndCreateAccount — e o cartão padrão vem de
          // createDefaultVirtualCard com o nome real.
          const localProfile = getLocalUserProfile(app.userId);
          if (localProfile) {
            setUserProfile(localProfile);
          } else {
            const approvedProfile: UserProfile = {
              uid: app.userId,
              name: app.fullName,
              preferredName: app.preferredName,
              document: app.cpf,
              email: app.email,
              photoURL: app.selfiePhoto || '',
              birthDate: app.birthDate,
              address: app.address,
              accountNumber: generateAccountNumber(),
              agency: '0001',
              bankCode: '592 - LeadsPay S.A.',
              balance: 0.00,
              investedBalance: 0.00,
              status: 'approved',
              pixKeys: [
                { type: 'cpf', value: app.cpf },
                { type: 'email', value: app.email },
                { type: 'phone', value: app.phone },
                { type: 'random', value: `lp-${Math.random().toString(36).substring(2, 10)}` }
              ],
              biometricEnabled: true,
              streetProtectionMode: false,
              dailyPixLimit: 10000.00,
              nightlyPixLimit: 1000.00
            };
            saveLocalUserProfile(app.userId, approvedProfile);
            const defaultCard = createDefaultVirtualCard(app.userId, app.fullName);
            saveLocalCards(app.userId, [defaultCard]);
            setCards([defaultCard]);
            setUserProfile(approvedProfile);
          }
          setCurrentScreen('bank');
          setRoute({ name: 'conta' });
          soundEffects.playPixSuccess();
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
