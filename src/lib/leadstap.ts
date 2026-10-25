import {
  collection,
  deleteDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  arrayRemove,
  arrayUnion,
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  auth,
  db,
  googleProvider,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from '../firebase/config';
import {
  FEE_MERCHANT_SALE_CENTS,
  FEE_P2P_LEADSTAP_CENTS,
  FEE_WITHDRAWAL_LEADSPAY_CENTS,
} from './fees';
import { normalizePixKey } from './format';
import type {
  LeadsTapProfile,
  LedgerEntry,
  MigrationRequest,
  PixKeyRecord,
  TapCharge,
} from '../types';

/**
 * LeadsTap — camada de dados real (projeto Firebase `leadspaybank`, mantido).
 *
 * Princípios:
 * - Nada de localStorage para dado financeiro, nada de perfil demo, nada de
 *   venda falsa. Todo movimento de dinheiro é um registro no ledger.
 * - Saldo = soma das entradas do ledger. Falha de escrita NUNCA vira saldo
 *   local otimista: erro aparece como erro.
 * - Limitação honesta: a integridade do ledger hoje depende das transações
 *   do cliente + regras do Firestore. Transações do Firestore não leem
 *   consultas, então a verificação de saldo é feita fora da transação e a
 *   atomicidade dentro dela cobre as duas pontas + o status da cobrança.
 *   Antes de qualquer trilho de dinheiro real, é preciso validação no
 *   servidor (backend). Nenhum dinheiro real se move neste app.
 */

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

export async function ensureProfile(input: {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}): Promise<LeadsTapProfile> {
  const ref = doc(db, 'users', input.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as LeadsTapProfile;
  }
  const profile: LeadsTapProfile = {
    uid: input.uid,
    displayName: input.displayName || input.email.split('@')[0],
    email: input.email,
    photoURL: input.photoURL || undefined,
    pixKeys: [],
    migratedFromLeadsPay: false,
    createdAt: null,
  };
  await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  return profile;
}

export function subscribeProfile(
  uid: string,
  cb: (profile: LeadsTapProfile | null) => void,
): () => void {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as LeadsTapProfile) : null);
  });
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

function entryMillis(e: LedgerEntry): number {
  const ts = e.createdAt as unknown as
    | { toMillis?: () => number; seconds?: number }
    | null
    | undefined;
  if (!ts) return Number.POSITIVE_INFINITY; // escrita local pendente: vai para o topo
  if (ts.toMillis) return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
}

function sortEntriesDesc(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((a, b) => entryMillis(b) - entryMillis(a));
}

export function subscribeLedger(
  uid: string,
  cb: (entries: LedgerEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'ledger_entries'),
    where('ownerUid', '==', uid),
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<LedgerEntry, 'id'>),
    }));
    cb(sortEntriesDesc(entries));
  });
}

/** Saldo real: soma das entradas do ledger, em centavos. */
export function sumBalanceCents(entries: LedgerEntry[]): number {
  return entries.reduce((acc, e) => acc + (e.amountCents || 0), 0);
}

/**
 * Economia real em saques: cada saque concluído pela LeadsTap economiza
 * R$ 2,00 em relação ao saque na LeadsPay. Zero quando não há dados.
 */
export function savingsFromWithdrawalsCents(entries: LedgerEntry[]): number {
  const count = entries.filter((e) => e.type === 'withdrawal').length;
  return count * FEE_WITHDRAWAL_LEADSPAY_CENTS;
}

// ---------------------------------------------------------------------------
// Cobranças LeadsTap (circuito fechado, sem cartão)
// ---------------------------------------------------------------------------

const CHARGE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomChargeCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARGE_CODE_ALPHABET[Math.floor(Math.random() * CHARGE_CODE_ALPHABET.length)];
  }
  return code;
}

export async function createTapCharge(input: {
  sellerUid: string;
  sellerName: string;
  amountGrossCents: number;
  description: string;
}): Promise<TapCharge> {
  const { sellerUid, sellerName, amountGrossCents, description } = input;
  if (!Number.isInteger(amountGrossCents) || amountGrossCents <= FEE_MERCHANT_SALE_CENTS) {
    throw new Error(
      `O valor da venda precisa ser maior que a taxa única de R$ ${(FEE_MERCHANT_SALE_CENTS / 100).toFixed(2).replace('.', ',')}.`,
    );
  }
  const feeCents = FEE_MERCHANT_SALE_CENTS;
  const netCents = amountGrossCents - feeCents;

  // Limitação honesta: transações do Firestore não leem consultas, só
  // documentos por referência. A colisão de código é verificada fora da
  // transação (espaço de ~1 bilhão de códigos; colisão simultânea é
  // desprezível) e a escrita da cobrança é atômica por si só. O pagamento
  // continua guardado pela transação (status da cobrança + duas pontas).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomChargeCode();
    const clash = await getDocs(
      query(collection(db, 'charges'), where('code', '==', code)),
    );
    if (!clash.empty) continue;
    const ref = doc(collection(db, 'charges'));
    await setDoc(ref, {
      code,
      sellerUid,
      sellerName,
      amountGrossCents,
      feeCents,
      netCents,
      description: description.trim(),
      status: 'open',
      createdAt: serverTimestamp(),
    });
    const snap = await getDoc(ref);
    return { id: ref.id, ...(snap.data() as Omit<TapCharge, 'id'>) };
  }
  throw new Error('Não foi possível gerar um código de cobrança. Tente novamente.');
}

export function subscribeSellerCharges(
  sellerUid: string,
  cb: (charges: TapCharge[]) => void,
): () => void {
  const q = query(
    collection(db, 'charges'),
    where('sellerUid', '==', sellerUid),
  );
  return onSnapshot(q, (snap) => {
    const charges = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TapCharge, 'id'>),
    }));
    charges.sort((a, b) => {
      const ma = a.createdAt as unknown as { toMillis?: () => number } | null;
      const mb = b.createdAt as unknown as { toMillis?: () => number } | null;
      return (mb?.toMillis?.() || 0) - (ma?.toMillis?.() || 0);
    });
    cb(charges);
  });
}

export async function payTapCharge(input: {
  payerUid: string;
  payerName: string;
  code: string;
}): Promise<{ charge: TapCharge; groupId: string }> {
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error('Informe o código da cobrança.');
  const found = await getDocs(
    query(collection(db, 'charges'), where('code', '==', code)),
  );
  const openDoc = found.docs.find((d) => d.data().status === 'open');
  if (!openDoc) {
    throw new Error('Cobrança não encontrada ou já encerrada.');
  }
  const chargeId = openDoc.id;
  const chargeRef = doc(db, 'charges', chargeId);

  // Saldo verificado fora da transação: transações do Firestore não leem
  // consultas. A guarda contra pagar a mesma cobrança duas vezes continua
  // dentro da transação (status lido por referência de documento).
  const payerEntries = await getDocs(
    query(
      collection(db, 'ledger_entries'),
      where('ownerUid', '==', input.payerUid),
    ),
  );
  const payerBalance = payerEntries.docs.reduce(
    (acc, d) => acc + ((d.data().amountCents as number) || 0),
    0,
  );
  const openData = openDoc.data();
  if (openData.sellerUid === input.payerUid) {
    throw new Error('Não é possível pagar a própria cobrança.');
  }
  if (payerBalance < (openData.amountGrossCents as number)) {
    throw new Error('Saldo insuficiente para pagar esta cobrança.');
  }

  const result = await runTransaction(db, async (tx) => {
    const chargeSnap = await tx.get(chargeRef);
    if (!chargeSnap.exists() || chargeSnap.data().status !== 'open') {
      throw new Error('Cobrança não encontrada ou já encerrada.');
    }
    const charge = chargeSnap.data() as Omit<TapCharge, 'id'>;
    if (charge.sellerUid === input.payerUid) {
      throw new Error('Não é possível pagar a própria cobrança.');
    }
    const payerEntryRef = doc(collection(db, 'ledger_entries'));
    const sellerEntryRef = doc(collection(db, 'ledger_entries'));
    tx.set(payerEntryRef, {
      groupId: chargeId,
      ownerUid: input.payerUid,
      counterpartyUid: charge.sellerUid,
      counterpartyName: charge.sellerName,
      type: 'tap_payment',
      amountCents: -charge.amountGrossCents,
      description: charge.description || 'Pagamento LeadsTap',
      relatedChargeId: chargeId,
      createdAt: serverTimestamp(),
      status: 'completed',
    });
    tx.set(sellerEntryRef, {
      groupId: chargeId,
      ownerUid: charge.sellerUid,
      counterpartyUid: input.payerUid,
      counterpartyName: input.payerName,
      type: 'tap_receipt',
      amountCents: charge.netCents,
      grossCents: charge.amountGrossCents,
      feeCents: charge.feeCents,
      description: charge.description || 'Venda LeadsTap',
      relatedChargeId: chargeId,
      createdAt: serverTimestamp(),
      status: 'completed',
    });
    tx.update(chargeRef, {
      status: 'paid',
      payerUid: input.payerUid,
      payerName: input.payerName,
      paidAt: serverTimestamp(),
    });
    return {
      charge: {
        id: chargeId,
        ...charge,
        status: 'paid' as const,
        payerUid: input.payerUid,
        payerName: input.payerName,
      },
      groupId: chargeId,
    };
  });
  return result;
}

export async function cancelTapCharge(input: {
  sellerUid: string;
  chargeId: string;
}): Promise<void> {
  const ref = doc(db, 'charges', input.chargeId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Cobrança não encontrada.');
    const data = snap.data();
    if (data.sellerUid !== input.sellerUid) {
      throw new Error('Somente o vendedor pode cancelar esta cobrança.');
    }
    if (data.status !== 'open') {
      throw new Error('Somente cobranças abertas podem ser canceladas.');
    }
    tx.update(ref, { status: 'cancelled' });
  });
}

// ---------------------------------------------------------------------------
// Pix interno (entre usuários LeadsTap, taxa 0)
// ---------------------------------------------------------------------------

export async function sendPixP2P(input: {
  senderUid: string;
  senderName: string;
  key: string;
  amountCents: number;
  description: string;
}): Promise<{ groupId: string; recipientName: string }> {
  const key = normalizePixKey(input.key);
  if (!key) throw new Error('Informe a chave Pix do destinatário.');
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }
  if (FEE_P2P_LEADSTAP_CENTS !== 0) {
    throw new Error('Regra interna violada: Pix entre usuários LeadsTap deve ser taxa 0.');
  }
  const groupRef = doc(collection(db, 'ledger_entries'));
  const groupId = groupRef.id;

  // Saldo verificado fora da transação (transações não leem consultas).
  // A chave é revalidada dentro da transação, por referência de documento.
  const senderEntries = await getDocs(
    query(
      collection(db, 'ledger_entries'),
      where('ownerUid', '==', input.senderUid),
    ),
  );
  const senderBalance = senderEntries.docs.reduce(
    (acc, d) => acc + ((d.data().amountCents as number) || 0),
    0,
  );
  if (senderBalance < input.amountCents) {
    throw new Error('Saldo insuficiente para este Pix.');
  }

  const recipientName = await runTransaction(db, async (tx) => {
    const keySnap = await tx.get(doc(db, 'pix_keys', key));
    if (!keySnap.exists()) {
      throw new Error('Chave não encontrada na LeadsTap.');
    }
    const record = keySnap.data() as PixKeyRecord;
    if (record.uid === input.senderUid) {
      throw new Error('Não é possível enviar Pix para a própria conta por aqui.');
    }
    tx.set(doc(collection(db, 'ledger_entries')), {
      groupId,
      ownerUid: input.senderUid,
      counterpartyUid: record.uid,
      counterpartyName: record.ownerName,
      type: 'pix_out',
      amountCents: -input.amountCents,
      feeCents: 0,
      description: input.description.trim() || 'Pix enviado',
      createdAt: serverTimestamp(),
      status: 'completed',
    });
    tx.set(doc(collection(db, 'ledger_entries')), {
      groupId,
      ownerUid: record.uid,
      counterpartyUid: input.senderUid,
      counterpartyName: input.senderName,
      type: 'pix_in',
      amountCents: input.amountCents,
      feeCents: 0,
      description: input.description.trim() || 'Pix recebido',
      createdAt: serverTimestamp(),
      status: 'completed',
    });
    return record.ownerName;
  });
  return { groupId, recipientName };
}

/** Resolve uma chave Pix para o nome do dono, sem mover dinheiro. */
export async function resolvePixKey(key: string): Promise<PixKeyRecord | null> {
  const normalized = normalizePixKey(key);
  if (!normalized) return null;
  const snap = await getDoc(doc(db, 'pix_keys', normalized));
  if (!snap.exists()) return null;
  return snap.data() as PixKeyRecord;
}

export async function registerPixKey(input: {
  uid: string;
  ownerName: string;
  key: string;
}): Promise<void> {
  const key = normalizePixKey(input.key);
  if (!key) throw new Error('Informe uma chave Pix.');
  const ref = doc(db, 'pix_keys', key);
  const snap = await getDoc(ref);
  if (snap.exists() && (snap.data() as PixKeyRecord).uid !== input.uid) {
    throw new Error('Esta chave já está registrada por outro usuário.');
  }
  const batch = writeBatch(db);
  batch.set(ref, {
    key,
    uid: input.uid,
    ownerName: input.ownerName,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', input.uid), {
    pixKeys: arrayUnion(key),
  });
  await batch.commit();
}

export async function removePixKey(input: {
  uid: string;
  key: string;
}): Promise<void> {
  const key = normalizePixKey(input.key);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'pix_keys', key));
  batch.update(doc(db, 'users', input.uid), {
    pixKeys: arrayRemove(key),
  });
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Migração LeadsPay -> LeadsTap (registro honesto, sem mover dinheiro)
// ---------------------------------------------------------------------------

export async function requestLeadsPayMigration(
  uid: string,
): Promise<MigrationRequest> {
  const ref = doc(db, 'migrations', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: ref.id, ...(snap.data() as Omit<MigrationRequest, 'id'>) };
  }
  const data = {
    uid,
    status: 'awaiting_confirmation' as const,
    requestedAt: serverTimestamp(),
    note: 'Solicitação registrada pelo usuário. A liquidação entre LeadsPay e LeadsTap depende de integração de backend e está pendente. Nenhum valor foi transferido.',
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data, requestedAt: null };
}

export function subscribeMigration(
  uid: string,
  cb: (migration: MigrationRequest | null) => void,
): () => void {
  return onSnapshot(doc(db, 'migrations', uid), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<MigrationRequest, 'id'>) }) : null);
  });
}
