export type TransactionType = 'pix_in' | 'pix_out' | 'tap_to_pay' | 'card_payment' | 'bill_payment' | 'investment';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  description: string;
  amount: number;
  timestamp: string; // ISO format or display
  dateFormatted: string;
  category: 'Vendas' | 'Alimentação' | 'Serviços' | 'Transporte' | 'Lojas' | 'Transferência' | 'Outros';
  status: 'completed' | 'pending' | 'failed';
  recipientOrSender?: string;
  documentId?: string;
  e2eId?: string;
  authMethod?: 'Biometria (Face ID)' | 'LeadsTap NFC' | 'Token Instantâneo' | 'Chave Pix';
}

export interface VirtualCard {
  id: string;
  name: string;
  type: 'virtual' | 'physical';
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  cvvExpiresInSeconds: number;
  isFrozen: boolean;
  limit: number;
  usedLimit: number;
  brand: 'mastercard' | 'visa';
  color: string;
  category: 'Uso Diário' | 'Assinaturas' | 'Compras Online' | 'Corporativo';
}

export interface FinancialCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  iconName: string;
  budget: number;
}

export interface DeveloperApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  environment: 'production' | 'sandbox';
  createdAt: string;
  lastUsed: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastDeliveryStatus?: '200_ok' | 'failed' | 'pending';
  lastDeliveryTime?: string;
}

export interface UserProfile {
  uid?: string;
  email?: string;
  photoURL?: string;
  name: string;
  document: string; // CPF or CNPJ
  accountNumber: string;
  agency: string;
  bankCode: string;
  balance: number;
  investedBalance: number;
  pixKeys: {
    type: 'cpf' | 'email' | 'phone' | 'random';
    value: string;
  }[];
  biometricEnabled: boolean;
  streetProtectionMode: boolean; // Modo Rua
  dailyPixLimit: number;
  nightlyPixLimit: number;
  status?: 'pending' | 'approved' | 'needs_revision' | 'rejected';
  preferredName?: string;
  birthDate?: string;
  address?: UserAddress;
}

export interface UserAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'needs_revision' | 'rejected';

export interface AccountApplication {
  id: string;
  userId: string;
  fullName: string;
  preferredName: string;
  birthDate: string;
  cpf: string;
  email: string;
  phone: string;
  address: UserAddress;
  docFrontPhoto: string;
  docBackPhoto: string;
  selfiePhoto: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  revisionNotes?: string;
  requestedRevisions?: string[];
}
