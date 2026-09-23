import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  User
} from '../firebase/config';
import { UserProfile, Transaction, VirtualCard, AccountApplication } from '../types';
import defaultBanner1 from '../assets/images/lifestyle_card_terminal_1790116104071.jpg';
import defaultBanner2 from '../assets/images/tap_to_pay_mobile_1790116091201.jpg';
import defaultBanner3 from '../assets/images/fintech_card_luxury_1790116114503.jpg';

export const DEFAULT_LOGIN_BANNERS: [string, string, string] = [
  defaultBanner1,
  defaultBanner2,
  defaultBanner3
];

export function getLocalLoginBanners(): [string, string, string] {
  try {
    const raw = localStorage.getItem('leadspay_login_banners');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3 && parsed[0]) {
        return [parsed[0], parsed[1], parsed[2]];
      }
    }
  } catch (e) {
    console.warn('Error reading local login banners:', e);
  }
  return DEFAULT_LOGIN_BANNERS;
}

export function saveLocalLoginBanners(banners: [string, string, string]): void {
  try {
    localStorage.setItem('leadspay_login_banners', JSON.stringify(banners));
  } catch (e) {
    console.error('Error saving local login banners:', e);
  }
}

export async function saveLoginBannersToFirestore(banners: [string, string, string]): Promise<void> {
  saveLocalLoginBanners(banners);
  try {
    const bannerRef = doc(db, 'app_settings', 'login_banners');
    await setDoc(bannerRef, {
      banners,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not sync login banners to cloud Firestore (saved locally):', err);
  }
}

export function subscribeToLoginBanners(callback: (banners: [string, string, string]) => void): () => void {
  callback(getLocalLoginBanners());
  const bannerRef = doc(db, 'app_settings', 'login_banners');
  return onSnapshot(
    bannerRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.banners) && data.banners.length >= 3) {
          const freshBanners: [string, string, string] = [data.banners[0], data.banners[1], data.banners[2]];
          saveLocalLoginBanners(freshBanners);
          callback(freshBanners);
        }
      }
    },
    (err) => {
      console.warn('Firestore banners sync error (using local fallback):', err.message);
    }
  );
}

export const generateAccountNumber = (): string => {
  const main = Math.floor(10000 + Math.random() * 89999);
  const digit = Math.floor(1 + Math.random() * 9);
  return `${main}-${digit}`;
};

export const createInitialUserProfile = (user: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  document?: string;
  phone?: string;
}): UserProfile => {
  const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Cliente LeadsPay');
  const email = user.email || 'cliente@leadspay.com.br';
  const cpfMasked = user.document || '000.***.***-00';
  const phone = user.phone || '+55 11 98842-7719';

  return {
    uid: user.uid,
    name,
    email,
    photoURL: user.photoURL || '',
    document: cpfMasked,
    accountNumber: generateAccountNumber(),
    agency: '0001',
    bankCode: '592 - LeadsPay S.A.',
    balance: 0.00,
    investedBalance: 0.00,
    pixKeys: [
      { type: 'email', value: email },
      { type: 'phone', value: phone },
      { type: 'random', value: `lp-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}` }
    ],
    biometricEnabled: true,
    streetProtectionMode: false,
    dailyPixLimit: 10000.00,
    nightlyPixLimit: 1000.00
  };
};

export const createDefaultVirtualCard = (uid: string, cardHolderName: string): VirtualCard => {
  const last4 = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `card-${Date.now()}`,
    name: 'Cartão LeadsPay Principal',
    type: 'virtual',
    cardNumber: `5482 •••• •••• ${last4}`,
    cardHolder: cardHolderName.toUpperCase(),
    expiry: '09/31',
    cvv: Math.floor(100 + Math.random() * 900).toString(),
    cvvExpiresInSeconds: 86400,
    isFrozen: false,
    limit: 10000.00,
    usedLimit: 0.00,
    brand: 'mastercard',
    color: 'linear-gradient(135deg, #0d120e 0%, #152217 50%, #00e676 250%)',
    category: 'Uso Diário'
  };
};

// Local storage individual user persistence helpers
export function getLocalUserProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`leadspay_user_${uid}`);
    if (!raw) return null;
    const profile = JSON.parse(raw) as UserProfile;
    if (typeof profile.balance === 'number' && profile.balance < 0) {
      profile.balance = 0;
      saveLocalUserProfile(uid, profile);
    }
    return profile;
  } catch {
    return null;
  }
}

export function getAllUserProfilesWithBalances(): UserProfile[] {
  const profiles: UserProfile[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('leadspay_user_profile_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const profile = JSON.parse(item) as UserProfile;
            if (profile && profile.name) {
              profile.balance = Math.max(0, profile.balance || 0);
              profiles.push(profile);
            }
          } catch {
            // ignore parse error
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching all user profiles:', err);
  }
  return profiles;
}

export function saveLocalUserProfile(uid: string, profile: UserProfile): void {
  try {
    const sanitized = {
      ...profile,
      balance: Math.max(0, profile.balance || 0)
    };
    localStorage.setItem(`leadspay_user_${uid}`, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Error saving local profile:', err);
  }
}

export function getLocalTransactions(uid: string): Transaction[] {
  try {
    const raw = localStorage.getItem(`leadspay_txs_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalTransactions(uid: string, txs: Transaction[]): void {
  try {
    localStorage.setItem(`leadspay_txs_${uid}`, JSON.stringify(txs));
  } catch (err) {
    console.error('Error saving local transactions:', err);
  }
}

export function getLocalCards(uid: string): VirtualCard[] {
  try {
    const raw = localStorage.getItem(`leadspay_cards_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCards(uid: string, cards: VirtualCard[]): void {
  try {
    localStorage.setItem(`leadspay_cards_${uid}`, JSON.stringify(cards));
  } catch (err) {
    console.error('Error saving local cards:', err);
  }
}

/**
 * Sign in using Google Auth Popup and load or initialize individual user account
 */
export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  const userDocRef = doc(db, 'users', firebaseUser.uid);

  let profile: UserProfile | null = getLocalUserProfile(firebaseUser.uid);

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      profile = docSnap.data() as UserProfile;
      profile.uid = firebaseUser.uid;
      saveLocalUserProfile(firebaseUser.uid, profile);
    } else {
      if (!profile) {
        profile = createInitialUserProfile({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
      }
      saveLocalUserProfile(firebaseUser.uid, profile);

      // Attempt to save in Firestore
      await setDoc(userDocRef, profile);

      const initialCard = createDefaultVirtualCard(firebaseUser.uid, profile.name);
      saveLocalCards(firebaseUser.uid, [initialCard]);
      await setDoc(doc(db, 'users', firebaseUser.uid, 'cards', initialCard.id), initialCard);
    }
  } catch (error) {
    console.warn('Firestore write warning (rules may be pending deployment in Firebase Console):', error);
    // If Firestore rules denied write, ensure individual user profile is safely active in memory & local storage
    if (!profile) {
      profile = createInitialUserProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL
      });
      saveLocalUserProfile(firebaseUser.uid, profile);
      const initialCard = createDefaultVirtualCard(firebaseUser.uid, profile.name);
      saveLocalCards(firebaseUser.uid, [initialCard]);
    }
  }

  return { user: firebaseUser, profile };
}

/**
 * Sign out current authenticated user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Real-time listener for user profile, individual transactions, and cards
 */
export function subscribeToUserAccount(
  uid: string,
  callbacks: {
    onProfile: (profile: UserProfile) => void;
    onTransactions: (transactions: Transaction[]) => void;
    onCards: (cards: VirtualCard[]) => void;
  }
): () => void {
  // Always load initial individual user state from localStorage first
  const cachedProfile = getLocalUserProfile(uid);
  if (cachedProfile) callbacks.onProfile(cachedProfile);

  const cachedTxs = getLocalTransactions(uid);
  if (cachedTxs.length > 0) callbacks.onTransactions(cachedTxs);

  const cachedCards = getLocalCards(uid);
  if (cachedCards.length > 0) callbacks.onCards(cachedCards);

  // Then listen to live Firestore if permitted
  const unsubProfile = onSnapshot(
    doc(db, 'users', uid),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        data.uid = uid;
        saveLocalUserProfile(uid, data);
        callbacks.onProfile(data);
      }
    },
    (err) => {
      console.warn('Firestore profile sync error (using local storage fallback):', err.message);
    }
  );

  const unsubTx = onSnapshot(
    collection(db, 'users', uid, 'transactions'),
    (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((d) => {
        txs.push(d.data() as Transaction);
      });
      txs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      });
      if (txs.length > 0) {
        saveLocalTransactions(uid, txs);
        callbacks.onTransactions(txs);
      }
    },
    (err) => {
      console.warn('Firestore transactions sync error (using local storage fallback):', err.message);
    }
  );

  const unsubCards = onSnapshot(
    collection(db, 'users', uid, 'cards'),
    (snapshot) => {
      const cards: VirtualCard[] = [];
      snapshot.forEach((d) => {
        cards.push(d.data() as VirtualCard);
      });
      if (cards.length > 0) {
        saveLocalCards(uid, cards);
        callbacks.onCards(cards);
      }
    },
    (err) => {
      console.warn('Firestore cards sync error (using local storage fallback):', err.message);
    }
  );

  return () => {
    unsubProfile();
    unsubTx();
    unsubCards();
  };
}

/**
 * Record a transaction into Firestore and update the user's balance
 */
export async function recordTransaction(uid: string, tx: Transaction, currentBalance: number): Promise<void> {
  const newBalance = Math.max(0, currentBalance + tx.amount);

  // 1. Update local storage for immediate individual persistence
  const currentTxs = getLocalTransactions(uid);
  saveLocalTransactions(uid, [tx, ...currentTxs]);

  const currentProf = getLocalUserProfile(uid);
  if (currentProf) {
    saveLocalUserProfile(uid, { ...currentProf, balance: newBalance });
  }

  // 2. Try Firestore
  try {
    const txRef = doc(db, 'users', uid, 'transactions', tx.id);
    const userRef = doc(db, 'users', uid);

    await setDoc(txRef, {
      ...tx,
      userId: uid
    });

    await updateDoc(userRef, {
      balance: newBalance
    });
  } catch (error) {
    console.warn('Could not sync transaction to cloud Firestore (saved locally):', error);
  }
}

/**
 * Save or update a card in Firestore and local storage
 */
export async function saveCard(uid: string, card: VirtualCard): Promise<void> {
  const currentCards = getLocalCards(uid);
  const exists = currentCards.some(c => c.id === card.id);
  const updated = exists ? currentCards.map(c => c.id === card.id ? card : c) : [card, ...currentCards];
  saveLocalCards(uid, updated);

  try {
    const cardRef = doc(db, 'users', uid, 'cards', card.id);
    await setDoc(cardRef, {
      ...card,
      userId: uid
    });
  } catch (error) {
    console.warn('Could not sync card to cloud Firestore (saved locally):', error);
  }
}

/**
 * Update user profile preferences in Firestore and local storage
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const currentProf = getLocalUserProfile(uid);
  if (currentProf) {
    saveLocalUserProfile(uid, { ...currentProf, ...updates });
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.warn('Could not sync profile to cloud Firestore (saved locally):', error);
  }
}

export const ADMIN_EMAIL = 'rickmarketing81@gmail.com';

export const isUserAdmin = (email?: string | null): boolean => {
  return email?.toLowerCase().trim() === ADMIN_EMAIL;
};

// Filter out demo/mock data helper
export const isFakeApplication = (app: AccountApplication): boolean => {
  return (
    app.id === 'app-demo-1' ||
    app.id.includes('demo') ||
    app.fullName === 'Lucas Gabriel Ferreira Mendes' ||
    app.cpf === '388.492.108-95'
  );
};

// Local storage for KYC Applications
export function getLocalApplications(): AccountApplication[] {
  try {
    const raw = localStorage.getItem('leadspay_all_applications');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccountApplication[];
    // Filter out fake demo applications so admin only sees real customer requests
    const clean = parsed.filter(a => !isFakeApplication(a));
    if (clean.length !== parsed.length) {
      saveLocalApplications(clean);
    }
    return clean;
  } catch {
    return [];
  }
}

export function saveLocalApplications(apps: AccountApplication[]): void {
  try {
    const clean = apps.filter(a => !isFakeApplication(a));
    localStorage.setItem('leadspay_all_applications', JSON.stringify(clean));
  } catch (err) {
    console.error('Error saving local applications:', err);
  }
}

export function clearFakeApplications(): void {
  try {
    const existing = getLocalApplications();
    const clean = existing.filter(a => !isFakeApplication(a));
    localStorage.setItem('leadspay_all_applications', JSON.stringify(clean));
  } catch (err) {
    console.error('Error clearing fake applications:', err);
  }
}

export function getLocalUserApplication(userId: string): AccountApplication | null {
  const all = getLocalApplications();
  return all.find(a => a.userId === userId) || null;
}

/**
 * Submit or update a KYC Account Application
 */
export async function submitAccountApplication(
  data: Omit<AccountApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }
): Promise<AccountApplication> {
  const appId = data.id || data.userId || `app-${Date.now()}`;
  const now = new Date().toISOString();

  const application: AccountApplication = {
    ...data,
    id: appId,
    userId: data.userId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    revisionNotes: undefined,
    requestedRevisions: undefined
  };

  // 1. Update local storage immediately
  const existing = getLocalApplications();
  const idx = existing.findIndex(a => a.userId === application.userId || a.id === application.id);
  const updatedList = idx >= 0
    ? existing.map((a, i) => (i === idx ? application : a))
    : [application, ...existing];
  saveLocalApplications(updatedList);

  // 2. Try Firestore
  try {
    const appRef = doc(db, 'account_applications', appId);
    await setDoc(appRef, application);
  } catch (err) {
    console.warn('Could not sync KYC application to cloud Firestore (saved locally):', err);
  }

  return application;
}

/**
 * Subscribe to a single user's application
 */
export function subscribeToUserApplication(
  userId: string,
  callback: (app: AccountApplication | null) => void
): () => void {
  // Initial local state
  const localApp = getLocalUserApplication(userId);
  if (localApp) callback(localApp);

  const unsub = onSnapshot(
    doc(db, 'account_applications', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AccountApplication;
        // update local
        const all = getLocalApplications();
        const idx = all.findIndex(a => a.userId === userId);
        const updated = idx >= 0 ? all.map((a, i) => (i === idx ? data : a)) : [data, ...all];
        saveLocalApplications(updated);
        callback(data);
      } else {
        // Check if there is an app by id
        const local = getLocalUserApplication(userId);
        callback(local);
      }
    },
    (err) => {
      console.warn('Firestore application listener notice:', err.message);
    }
  );

  return unsub;
}

/**
 * Subscribe to all applications (Admin only)
 */
export function subscribeToAllApplications(
  callback: (apps: AccountApplication[]) => void
): () => void {
  // Provide local immediately
  const initial = getLocalApplications();
  callback(initial);

  const unsub = onSnapshot(
    collection(db, 'account_applications'),
    (snapshot) => {
      const list: AccountApplication[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as AccountApplication);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (list.length > 0) {
        saveLocalApplications(list);
        callback(list);
      }
    },
    (err) => {
      console.warn('Firestore all applications listener notice:', err.message);
    }
  );

  return unsub;
}

/**
 * Admin action: Approve application and generate user bank account
 */
export async function approveApplicationAndCreateAccount(application: AccountApplication): Promise<void> {
  const now = new Date().toISOString();
  const updatedApp: AccountApplication = {
    ...application,
    status: 'approved',
    reviewedAt: now,
    reviewedBy: ADMIN_EMAIL,
    updatedAt: now
  };

  // 1. Update applications list
  const apps = getLocalApplications();
  const updatedApps = apps.map(a => a.id === application.id || a.userId === application.userId ? updatedApp : a);
  saveLocalApplications(updatedApps);

  // 2. Generate User Bank Account Profile
  const userProfile: UserProfile = {
    uid: application.userId,
    name: application.fullName,
    preferredName: application.preferredName,
    email: application.email,
    photoURL: application.selfiePhoto,
    document: application.cpf,
    birthDate: application.birthDate,
    address: application.address,
    accountNumber: generateAccountNumber(),
    agency: '0001',
    bankCode: '592 - LeadsPay S.A.',
    balance: 0.00,
    investedBalance: 0.00,
    status: 'approved',
    pixKeys: [
      { type: 'cpf', value: application.cpf },
      { type: 'email', value: application.email },
      { type: 'phone', value: application.phone },
      { type: 'random', value: `lp-${Math.random().toString(36).substring(2, 10)}` }
    ],
    biometricEnabled: true,
    streetProtectionMode: false,
    dailyPixLimit: 10000.00,
    nightlyPixLimit: 1000.00
  };

  saveLocalUserProfile(application.userId, userProfile);
  const initialCard = createDefaultVirtualCard(application.userId, application.fullName);
  saveLocalCards(application.userId, [initialCard]);

  // 3. Sync to Firestore
  try {
    await setDoc(doc(db, 'account_applications', application.id || application.userId), updatedApp);
    await setDoc(doc(db, 'users', application.userId), userProfile);
    await setDoc(doc(db, 'users', application.userId, 'cards', initialCard.id), initialCard);
  } catch (err) {
    console.warn('Could not sync approval to cloud Firestore (saved locally):', err);
  }
}

/**
 * Admin action: Request user to revise or retake documents
 */
export async function requestApplicationRevision(
  applicationId: string,
  userId: string,
  notes: string,
  requestedRevisions: string[]
): Promise<void> {
  const now = new Date().toISOString();
  const apps = getLocalApplications();
  const target = apps.find(a => a.id === applicationId || a.userId === userId);
  if (!target) return;

  const updatedApp: AccountApplication = {
    ...target,
    status: 'needs_revision',
    revisionNotes: notes,
    requestedRevisions,
    reviewedAt: now,
    reviewedBy: ADMIN_EMAIL,
    updatedAt: now
  };

  const updatedApps = apps.map(a => a.id === applicationId || a.userId === userId ? updatedApp : a);
  saveLocalApplications(updatedApps);

  try {
    await setDoc(doc(db, 'account_applications', applicationId || userId), updatedApp);
  } catch (err) {
    console.warn('Could not sync revision request to cloud Firestore (saved locally):', err);
  }
}

/**
 * Admin action: Reject application
 */
export async function rejectApplication(
  applicationId: string,
  userId: string,
  reason: string
): Promise<void> {
  const now = new Date().toISOString();
  const apps = getLocalApplications();
  const target = apps.find(a => a.id === applicationId || a.userId === userId);
  if (!target) return;

  const updatedApp: AccountApplication = {
    ...target,
    status: 'rejected',
    revisionNotes: reason,
    reviewedAt: now,
    reviewedBy: ADMIN_EMAIL,
    updatedAt: now
  };

  const updatedApps = apps.map(a => a.id === applicationId || a.userId === userId ? updatedApp : a);
  saveLocalApplications(updatedApps);

  try {
    await setDoc(doc(db, 'account_applications', applicationId || userId), updatedApp);
  } catch (err) {
    console.warn('Could not sync rejection to cloud Firestore (saved locally):', err);
  }
}

/**
 * Auto-Save Registration Draft Helpers
 */
export const REGISTRATION_DRAFT_KEY = 'leadspay_registration_draft';

export interface RegistrationDraft {
  step: 1 | 2 | 3 | 4;
  fullName: string;
  preferredName: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  docFrontPhoto: string;
  docBackPhoto: string;
  selfiePhoto: string;
  updatedAt: string;
}

export function saveRegistrationDraft(draft: Partial<RegistrationDraft>): void {
  try {
    const existing = getRegistrationDraft() || {
      step: 1,
      fullName: '',
      preferredName: '',
      cpf: '',
      birthDate: '',
      email: '',
      phone: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      docFrontPhoto: '',
      docBackPhoto: '',
      selfiePhoto: '',
      updatedAt: new Date().toISOString()
    };
    const updated: RegistrationDraft = {
      ...existing,
      ...draft,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving registration draft:', err);
  }
}

export function getRegistrationDraft(): RegistrationDraft | null {
  try {
    const raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegistrationDraft;
  } catch {
    return null;
  }
}

export function clearRegistrationDraft(): void {
  try {
    localStorage.removeItem(REGISTRATION_DRAFT_KEY);
  } catch (err) {
    console.warn('Error clearing registration draft:', err);
  }
}

/**
 * Find user application by email or CPF (case-insensitive and format-agnostic)
 */
export function findApplicationByEmailOrCpf(identifier: string): AccountApplication | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const cleanDigits = identifier.replace(/\D/g, '');
  const allApps = getLocalApplications();

  return (
    allApps.find((app) => {
      const appEmail = app.email?.toLowerCase().trim();
      const appCpfDigits = app.cpf?.replace(/\D/g, '');
      const matchesEmail = appEmail && appEmail === clean;
      const matchesCpf = cleanDigits.length >= 11 && appCpfDigits === cleanDigits;
      return matchesEmail || matchesCpf;
    }) || null
  );
}

/**
 * Find existing approved user profile by email or CPF
 */
export function findUserProfileByEmailOrCpf(identifier: string): UserProfile | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const cleanDigits = identifier.replace(/\D/g, '');

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('leadspay_user_profile_')) {
        const item = localStorage.getItem(key);
        if (item) {
          const profile = JSON.parse(item) as UserProfile;
          const userEmail = profile.email?.toLowerCase().trim();
          const userDocDigits = (profile.document || '').replace(/\D/g, '');
          if ((userEmail && userEmail === clean) || (cleanDigits.length >= 11 && userDocDigits === cleanDigits)) {
            return profile;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error finding user profile:', e);
  }
  return null;
}


