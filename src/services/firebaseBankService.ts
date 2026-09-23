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
  query,
  handleFirestoreError,
  OperationType,
  User
} from '../firebase/config';
import { UserProfile, Transaction, VirtualCard } from '../types';

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
  const name = user.displayName || 'Cliente LeadsPay';
  const email = user.email || 'cliente@leadspay.com.br';
  const cpfMasked = user.document || '000.***.***-00';
  const phone = user.phone || '+55 11 98842-7719';

  return {
    uid: user.uid,
    name,
    email,
    photoURL: user.photoURL || undefined,
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

/**
 * Sign in using Google Auth Popup and load or initialize individual user Firestore account
 */
export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  const userDocRef = doc(db, 'users', firebaseUser.uid);

  let profile: UserProfile;

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      profile = docSnap.data() as UserProfile;
      profile.uid = firebaseUser.uid;
    } else {
      // First time user: create individual account with balance 0.00
      profile = createInitialUserProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL
      });

      await setDoc(userDocRef, profile);

      // Create initial virtual card for the user
      const initialCard = createDefaultVirtualCard(firebaseUser.uid, profile.name);
      await setDoc(doc(db, 'users', firebaseUser.uid, 'cards', initialCard.id), initialCard);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    throw error;
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
  const unsubProfile = onSnapshot(
    doc(db, 'users', uid),
    (docSnap) => {
      if (docSnap.exists()) {
        callbacks.onProfile(docSnap.data() as UserProfile);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
  );

  const unsubTx = onSnapshot(
    collection(db, 'users', uid, 'transactions'),
    (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((d) => {
        txs.push(d.data() as Transaction);
      });
      // Sort newest first by timestamp or id
      txs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      });
      callbacks.onTransactions(txs);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/transactions`)
  );

  const unsubCards = onSnapshot(
    collection(db, 'users', uid, 'cards'),
    (snapshot) => {
      const cards: VirtualCard[] = [];
      snapshot.forEach((d) => {
        cards.push(d.data() as VirtualCard);
      });
      callbacks.onCards(cards);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/cards`)
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
  const txRef = doc(db, 'users', uid, 'transactions', tx.id);
  const userRef = doc(db, 'users', uid);

  try {
    // Save transaction
    await setDoc(txRef, {
      ...tx,
      userId: uid
    });

    // Update user balance
    const newBalance = currentBalance + tx.amount;
    await updateDoc(userRef, {
      balance: newBalance
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/transactions/${tx.id}`);
    throw error;
  }
}

/**
 * Save or update a card in Firestore
 */
export async function saveCard(uid: string, card: VirtualCard): Promise<void> {
  const cardRef = doc(db, 'users', uid, 'cards', card.id);
  try {
    await setDoc(cardRef, {
      ...card,
      userId: uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/cards/${card.id}`);
    throw error;
  }
}

/**
 * Update user profile preferences in Firestore
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}
