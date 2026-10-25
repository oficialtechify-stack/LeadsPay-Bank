import type { Timestamp } from 'firebase/firestore';

/**
 * LeadsTap — modelo de dados real.
 *
 * Regras que este modelo impõe:
 * - Dinheiro é medido em CENTAVOS (inteiros). Nunca floats de reais.
 * - Saldo = soma das entradas do ledger do usuário. Nenhum saldo é
 *   inventado, estimado ou guardado em paralelo.
 * - Não existe cartão, banco, agência, rendimento ou limite neste modelo:
 *   esses produtos não existem na LeadsTap e não são representados.
 */

export interface LeadsTapProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  /** Chaves Pix registradas pelo próprio usuário (identificadores dentro da LeadsTap). */
  pixKeys: string[];
  /** Verdadeiro somente após liquidação concluída da migração (backend). */
  migratedFromLeadsPay: boolean;
  createdAt: Timestamp | null;
}

export type LedgerEntryType =
  | 'pix_in'
  | 'pix_out'
  | 'tap_payment'
  | 'tap_receipt'
  /**
   * Reservado para quando o trilho externo de saque existir. Hoje nenhum
   * registro desse tipo pode ser criado (saque externo está pendente de
   * trilho e nunca aparece como concluído).
   */
  | 'withdrawal';

/**
 * Uma ponta de um movimento real de dinheiro, na perspectiva do dono.
 * Movimentos de duas pontas (Pix P2P, cobrança Tap) geram DUAS entradas com
 * o mesmo groupId, escritas na mesma transação do Firestore.
 */
export interface LedgerEntry {
  id: string;
  /** Identificador compartilhado pelas duas pontas do mesmo movimento. */
  groupId: string;
  ownerUid: string;
  counterpartyUid: string;
  counterpartyName: string;
  type: LedgerEntryType;
  /** Sinal: positivo = entrou, negativo = saiu. Em centavos. */
  amountCents: number;
  /** Para tap_receipt: valor bruto cobrado. */
  grossCents?: number;
  /** Para tap_receipt: taxa única descontada (R$ 0,99). */
  feeCents?: number;
  description: string;
  relatedChargeId?: string;
  createdAt: Timestamp | null;
  status: 'completed';
}

/**
 * Cobrança LeadsTap em circuito fechado: o vendedor cria, outro usuário
 * LeadsTap paga com saldo real. Nunca envolve cartão ou adquirência.
 */
export interface TapCharge {
  id: string;
  /** Código curto que o pagador digita para encontrar a cobrança. */
  code: string;
  sellerUid: string;
  sellerName: string;
  amountGrossCents: number;
  feeCents: number;
  netCents: number;
  description: string;
  status: 'open' | 'paid' | 'cancelled';
  payerUid?: string;
  payerName?: string;
  createdAt: Timestamp | null;
  paidAt?: Timestamp | null;
}

/** Índice chave Pix -> usuário, para resolver o destinatário de um Pix interno. */
export interface PixKeyRecord {
  key: string;
  uid: string;
  ownerName: string;
  createdAt: Timestamp | null;
}

/**
 * Solicitação de migração LeadsPay -> LeadsTap.
 * Criar este registro NÃO move dinheiro: a liquidação entre sistemas
 * depende de integração de backend e fica pendente até lá.
 */
export interface MigrationRequest {
  id: string;
  uid: string;
  status: 'awaiting_confirmation';
  requestedAt: Timestamp | null;
  note: string;
}
