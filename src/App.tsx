import React, { useState, useEffect, useRef } from 'react';
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
  updateDoc,
  db
} from './firebase/config';
import {
  signInWithGoogle,
  logOut,
  subscribeToUserAccount,
  subscribeToUserApplication,
  recordTransaction,
  saveCard,
  updateUserProfile as updateUserProfileInDb,
  createInitialUserProfile,
  createDefaultVirtualCard,
  generateCardExpiry,
  getLocalUserProfile,
  getLocalCards,
  saveLocalUserProfile,
  saveLocalCards,
  getServerApplication,
  getServerProfile,
  getServerCards,
  getRegistrationDraft,
  ADMIN_EMAIL,
  findApplicationByEmailOrCpf,
  getLocalUserApplication,
  saveRegistrationDraft,
  clearRegistrationDraft,
  markLocalProfileApproved,
  RegistrationDraft
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
  // Mensagem inicial do modal de acesso (prop `initialMessage`, §3.5): usada
  // pelo gate do `onApprovedLogin` e pelo atalho "Área Pix" (§3.6).
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  // Assinaturas do Firestore (§3.4, DET-4): a da conta e a da aplicação
  // vivem em refs próprios, para o `enterBank` (fora do efeito) e o logout
  // poderem cancelá-las — e o cleanup do efeito cancelar as duas.
  const accountUnsubscribeRef = useRef<(() => void) | null>(null);
  const applicationUnsubscribeRef = useRef<(() => void) | null>(null);

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

  // Rotina única de entrada no banco (§3.4, `enterBank`): usada pelo ramo A,
  // pela transição pendente→aprovado e pelo `onApprovedLogin` (§3.5). O
  // `serverProfile` é o perfil JÁ LIDO pela decisão — é ele que diz se o
  // documento `users/{uid}` existe no servidor, sem nova leitura. Se o
  // chamador não o tiver, o `enterBank` faz o one-shot antes de decidir.
  const enterBank = async (uid: string, approvedApp?: AccountApplication | null, serverProfile?: UserProfile | null) => {
    clearRegistrationDraft();
    setIsPendingApprovalModalOpen(false);

    let serverDoc: UserProfile | null | undefined = serverProfile;
    if (serverDoc === undefined) {
      try {
        serverDoc = await getServerProfile(uid);
      } catch (err) {
        console.warn('enterBank: não foi possível ler o perfil no servidor:', err);
        serverDoc = null;
      }
    }

    let profile: UserProfile;
    if (serverDoc) {
      // Perfil existe no servidor (aprovado ou legado): entra com ele e
      // carimba `approved` no estado (fecha DET-5). Legado sem carimbo
      // ganha o carimbo no servidor como best-effort, sem travar a entrada.
      profile = markLocalProfileApproved({ ...serverDoc, uid });
      if (serverDoc.status === undefined) {
        updateDoc(doc(db, 'users', uid), { status: 'approved' }).catch(() => {});
      }
    } else if (approvedApp) {
      // Aprovação parcial: proposta aprovada mas perfil sem sync. Monta o
      // perfil a partir da proposta e o persiste com `setDoc` (fecha IMP-5)
      // — sem isso, os `updateDoc` de saldo/perfil falham para sempre.
      profile = createInitialUserProfile({
        uid,
        displayName: approvedApp.fullName,
        email: approvedApp.email,
        photoURL: approvedApp.selfiePhoto
      });
      profile.status = 'approved';
      saveLocalUserProfile(uid, profile);
      try {
        await setDoc(doc(db, 'users', uid), profile);
      } catch (err) {
        console.warn('enterBank: não foi possível persistir o perfil no servidor:', err);
      }
    } else {
      const local = getLocalUserProfile(uid);
      profile = local
        ? markLocalProfileApproved(local)
        : createInitialUserProfile({
            uid,
            displayName: auth.currentUser?.displayName,
            email: auth.currentUser?.email,
            photoURL: auth.currentUser?.photoURL
          });
      profile.status = 'approved';
    }
    profile.balance = Math.max(0, profile.balance || 0);
    profile.status = 'approved';
    setUserProfile(profile);

    // Assinatura da conta — o ÚNICO carregador de perfil + transações +
    // cartões (são subcoleções, não campos do doc).
    if (accountUnsubscribeRef.current) {
      accountUnsubscribeRef.current();
      accountUnsubscribeRef.current = null;
    }
    accountUnsubscribeRef.current = subscribeToUserAccount(uid, {
      onProfile: (updatedProfile) => {
        setUserProfile(prev => ({
          ...prev,
          ...updatedProfile,
          balance: Math.max(0, updatedProfile.balance || 0),
          uid
        }));
      },
      onTransactions: (updatedTxs) => setTransactions(updatedTxs),
      onCards: (updatedCards) => {
        if (updatedCards.length > 0) setCards(updatedCards);
      }
    });

    // Regra de cartão (fecha IMP-6, corrigida pela revisão v3): one-shot
    // ANTES de decidir — o listener nunca reporta lista vazia. Só cria o
    // cartão padrão se o snapshot do servidor vier vazio E o local estiver
    // vazio. Aprovado novo já tem o cartão da aprovação: não dispara.
    try {
      const serverCards = await getServerCards(uid);
      const localCards = getLocalCards(uid);
      if (serverCards.length === 0 && localCards.length === 0) {
        const card = createDefaultVirtualCard(uid, profile.name);
        saveLocalCards(uid, [card]);
        setCards([card]);
        try {
          await setDoc(doc(db, 'users', uid, 'cards', card.id), card);
        } catch (err) {
          console.warn('enterBank: não foi possível persistir o cartão no servidor:', err);
        }
      }
    } catch (err) {
      console.warn('enterBank: não foi possível ler os cartões no servidor:', err);
    }

    setCurrentScreen('bank');
  };

  // Assinatura da aplicação (§3.4, DET-4): vive num ref próprio. O callback
  // inicial entrega a cópia local — PROVISÓRIA, ignorada: a decisão já foi
  // tomada pelo `getDoc` one-shot; a assinatura só comanda transições
  // (aprovado / em ajuste / rejeitado) a partir do snapshot do servidor.
  const cancelApplicationSubscription = () => {
    if (applicationUnsubscribeRef.current) {
      applicationUnsubscribeRef.current();
      applicationUnsubscribeRef.current = null;
    }
  };

  const subscribeApplication = (uid: string) => {
    cancelApplicationSubscription();
    let isInitialLocal = true;
    applicationUnsubscribeRef.current = subscribeToUserApplication(uid, (app) => {
      if (isInitialLocal) return;
      if (!app) return;
      if (app.status === 'approved') {
        cancelApplicationSubscription();
        void enterBank(uid, app);
      } else {
        setPendingApp(app);
      }
    });
    isInitialLocal = false;
  };

  // Pré-preenchimento do Google no rascunho (§3.1(i), ramo C): mescla SÓ
  // valores com conteúdo — campos vazios (`''`/`null`) nunca entram no
  // merge, e sem dado do Google nada é mesclado. Regra de identidade: se o
  // rascunho tem e-mail e ele difere do e-mail da sessão nova, o rascunho
  // é limpo antes de mesclar (troca de pessoa no mesmo aparelho).
  const mergeGooglePrefillIntoDraft = (
    user: { displayName?: string | null; photoURL?: string | null },
    userEmail: string
  ) => {
    const draft = getRegistrationDraft();
    if (
      draft?.email &&
      userEmail &&
      draft.email.toLowerCase().trim() !== userEmail.toLowerCase().trim()
    ) {
      clearRegistrationDraft();
    }
    const prefill: Partial<RegistrationDraft> = {};
    if (user.displayName) {
      prefill.fullName = user.displayName;
      prefill.preferredName = user.displayName.split(' ')[0];
    }
    if (userEmail) prefill.email = userEmail;
    if (user.photoURL) prefill.selfiePhoto = user.photoURL;
    if (Object.keys(prefill).length > 0) {
      saveRegistrationDraft(prefill);
    }
  };

  // Real-time Firebase Authentication & per-user individual Firestore synchronization
  // Fonte da verdade é o SERVIDOR (§3.4): as duas leituras one-shot são
  // feitas antes dos ramos A/B/C, cada uma com catch separado por código de
  // erro — `permission-denied` é erro de regra (registrado, nunca tratado
  // como offline); `unavailable` / `network-request-failed` é fallback
  // local silencioso. Se qualquer leitura falhar, a decisão usa os dados
  // locais exatamente como hoje (passo 6) — o local nunca vence o servidor
  // quando o servidor respondeu.
  useEffect(() => {
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

        const uid = currentUser.uid;

        // Leituras do servidor, independentes (nunca um `Promise.all` que
        // descarta os dois resultados quando um rejeita).
        const readServer = async <T,>(
          label: string,
          fn: () => Promise<T | null>
        ): Promise<{ value: T | null; failed: boolean }> => {
          try {
            return { value: await fn(), failed: false };
          } catch (err) {
            const code = (err as { code?: string })?.code || '';
            if (code === 'permission-denied') {
              console.error(
                `[Bank] permission-denied ao ler ${label} — conferir a publicação das regras (§4 item 5).`,
                err
              );
            } else if (code === 'unavailable' || code === 'network-request-failed') {
              console.warn(`[Bank] sem rede ao ler ${label} — usando dados locais.`, err);
            } else {
              console.error(
                `[Bank] erro ao ler ${label} (código ${code || 'desconhecido'}) — usando dados locais.`,
                err
              );
            }
            return { value: null, failed: true };
          }
        };

        const appRead = await readServer(
          `account_applications/${uid}`,
          () => getServerApplication(uid)
        );
        const profileRead = await readServer(
          `users/${uid}`,
          () => getServerProfile(uid)
        );

        // Passo 6 — fallback local: qualquer leitura falhou. Ramos A/B/C
        // exatamente como hoje, com os dados locais.
        if (appRead.failed || profileRead.failed) {
          console.warn('[Bank] decisão de entrada por dados locais (servidor sem resposta).');
          const existingApp = getLocalUserApplication(uid) ||
                              (userEmail ? findApplicationByEmailOrCpf(userEmail) : null);
          const existingProfile = getLocalUserProfile(uid);

          // A. Aprovado pelo administrador — ou conta existente de antes do
          // sistema de aprovação (sem carimbo de status): perfil existente
          // vale como conta válida e é carimbado na hora, em vez de cair no
          // questionário de criar conta.
          const approvedProfile = existingProfile ? markLocalProfileApproved(existingProfile) : null;
          if (existingApp?.status === 'approved' || approvedProfile) {
            let profile = approvedProfile || createInitialUserProfile({
              uid,
              displayName: existingApp?.fullName || currentUser.displayName || 'Cliente LeadsPay',
              email: currentUser.email || existingApp?.email || '',
              photoURL: existingApp?.selfiePhoto || currentUser.photoURL
            });
            profile.balance = Math.max(0, profile.balance || 0);
            profile.status = 'approved';
            clearRegistrationDraft();
            setUserProfile(profile);

            if (accountUnsubscribeRef.current) accountUnsubscribeRef.current();
            accountUnsubscribeRef.current = subscribeToUserAccount(uid, {
              onProfile: (updatedProfile) => {
                setUserProfile(prev => ({
                  ...prev,
                  ...updatedProfile,
                  balance: Math.max(0, updatedProfile.balance || 0),
                  uid
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
            mergeGooglePrefillIntoDraft(currentUser, userEmail);
            setOpenAccountPrefill({ email: userEmail });
            setIsOpenAccountModalOpen(true);
          }
          return;
        }

        const serverApp = appRead.value;
        const serverProfile = profileRead.value;

        // Passo 2 — Aprovado (ramo A): proposta aprovada OU perfil aprovado.
        if (serverApp?.status === 'approved' || serverProfile?.status === 'approved') {
          await enterBank(uid, serverApp, serverProfile);
          return;
        }

        // Passo 3 — Legado pré-KYC (ramo A): perfil no servidor, sem
        // proposta, sem carimbo. É a conta de setembro.
        if (serverProfile && !serverApp && serverProfile.status === undefined) {
          await enterBank(uid, null, serverProfile);
          return;
        }

        // Passo 4 — Pendente / em ajuste (ramo B): modal de aguardo COM a
        // proposta do servidor, e a assinatura que acompanha transições.
        if (serverApp && (serverApp.status === 'pending' || serverApp.status === 'needs_revision')) {
          setCurrentScreen('onboarding');
          setPendingApp(serverApp);
          setIsPendingApprovalModalOpen(true);
          subscribeApplication(uid);
          return;
        }

        // Passo 7 — Rejeitada: estado de rejeição (§3.9), não o modal de
        // aguardo "em análise". Assinatura ativa, como no passo 4.
        if (serverApp?.status === 'rejected') {
          setCurrentScreen('onboarding');
          setPendingApp(serverApp);
          setIsPendingApprovalModalOpen(true);
          subscribeApplication(uid);
          return;
        }

        // Passo 5 — Sem conta (ramo C): abre o cadastro, sem
        // `clearRegistrationDraft()` — o rascunho é mesclado (§3.1).
        if (!serverApp && !serverProfile) {
          setCurrentScreen('onboarding');
          mergeGooglePrefillIntoDraft(currentUser, userEmail);
          setOpenAccountPrefill({ email: userEmail });
          setIsOpenAccountModalOpen(true);
          return;
        }

        // Passo 8 — Ramo padrão: perfil no servidor com status diferente de
        // 'approved' e de indefinido (e sem proposta). Hoje inalcançável —
        // nenhum escritor grava outro status em `users/{uid}`. O cadastro é
        // o caminho seguro: nunca entra no banco sem aprovação.
        console.warn(
          '[Bank] perfil no servidor com status inesperado e sem proposta — abrindo cadastro.',
          serverProfile?.status
        );
        setCurrentScreen('onboarding');
        mergeGooglePrefillIntoDraft(currentUser, userEmail);
        setOpenAccountPrefill({ email: userEmail });
        setIsOpenAccountModalOpen(true);
      } else {
        if (accountUnsubscribeRef.current) {
          accountUnsubscribeRef.current();
          accountUnsubscribeRef.current = null;
        }
        cancelApplicationSubscription();
      }
    });

    return () => {
      unsubscribeAuth();
      if (accountUnsubscribeRef.current) accountUnsubscribeRef.current();
      cancelApplicationSubscription();
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

  // Google Sign-in Handler (§3.5): faz SÓ `await signInWithGoogle()` — o
  // listener (§3.4) decide a tela. O ramo do admin, a checagem de
  // proposta/perfil local e o `clearRegistrationDraft()` do ramo C somem
  // junto com a decisão deste handler. A rota não é definida aqui (DET-9):
  // no re-login em sessão, a rota do usuário é preservada.
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
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

  // Botão "Acessar Minha Conta Aprovada" (§3.5): gate na primeira linha —
  // sem sessão, ou com UID diferente da proposta, fecha o modal e abre o
  // login com a mensagem (prop `initialMessage`) — e NÃO entra. Se o gate
  // passar, o corpo antigo (montar perfil a partir da proposta) é
  // substituído por `enterBank`: o perfil já existe no servidor (a
  // aprovação o escreveu), e a entrada assina o `subscribeToUserAccount`
  // como todo o resto.
  const handleApprovedLogin = async (app: AccountApplication) => {
    if (!auth.currentUser || auth.currentUser.uid !== app.userId) {
      setIsPendingApprovalModalOpen(false);
      setAccessMessage('Entre com e-mail e senha ou com o Google para acessar sua conta aprovada.');
      setIsAccessAccountModalOpen(true);
      return;
    }
    setIsPendingApprovalModalOpen(false);
    await enterBank(app.userId, app);
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
                // §3.6: o atalho "Área Pix" passa a exigir login.
                if (!auth.currentUser) {
                  setAccessMessage('Entre para usar o Pix.');
                  setIsAccessAccountModalOpen(true);
                  return;
                }
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
        onClose={() => {
          setIsAccessAccountModalOpen(false);
          setAccessMessage(null);
        }}
        onGoogleSignIn={handleGoogleSignIn}
        initialMessage={accessMessage ?? undefined}
        onOpenRegister={(prefill) => {
          setOpenAccountPrefill(prefill);
          setIsAccessAccountModalOpen(false);
          setIsOpenAccountModalOpen(true);
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
        onApprovedLogin={handleApprovedLogin}
        onStatusRefreshed={(serverApp) => {
          if (serverApp) setPendingApp(serverApp);
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
