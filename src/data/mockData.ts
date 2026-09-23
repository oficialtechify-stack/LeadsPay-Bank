import { Transaction, VirtualCard, FinancialCategory, DeveloperApiKey, WebhookConfig, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  name: 'Henrique M. Silveira',
  document: '389.***.418-02',
  accountNumber: '48201-9',
  agency: '0001',
  bankCode: '592 - LeadsPay S.A.',
  balance: 0.00,
  investedBalance: 0.00,
  pixKeys: [
    { type: 'cpf', value: '389.***.418-02' },
    { type: 'email', value: 'contato@leadspay.com.br' },
    { type: 'phone', value: '+55 11 98842-7719' },
    { type: 'random', value: 'e89f21ab-6f23-4bb9-9230-0192eab87f42' }
  ],
  biometricEnabled: true,
  streetProtectionMode: false,
  dailyPixLimit: 10000.00,
  nightlyPixLimit: 1000.00
};

export const initialTransactions: Transaction[] = [];

export const initialVirtualCards: VirtualCard[] = [
  {
    id: 'card-01',
    name: 'Cartão LeadsPay Principal',
    type: 'virtual',
    cardNumber: '5482 •••• •••• 9920',
    cardHolder: 'HENRIQUE M SILVEIRA',
    expiry: '09/31',
    cvv: '849',
    cvvExpiresInSeconds: 86400,
    isFrozen: false,
    limit: 10000.00,
    usedLimit: 0.00,
    brand: 'mastercard',
    color: 'linear-gradient(135deg, #0d120e 0%, #152217 50%, #00e676 250%)',
    category: 'Uso Diário'
  }
];

export const initialFinancialCategories: FinancialCategory[] = [
  {
    name: 'Vendas & LeadsTap',
    amount: 0.00,
    percentage: 0,
    color: '#00e676',
    iconName: 'SmartphoneNfc',
    budget: 5000.00
  },
  {
    name: 'Serviços & Software',
    amount: 0.00,
    percentage: 0,
    color: '#3b82f6',
    iconName: 'Server',
    budget: 2000.00
  },
  {
    name: 'Alimentação & Café',
    amount: 0.00,
    percentage: 0,
    color: '#f59e0b',
    iconName: 'Coffee',
    budget: 1000.00
  },
  {
    name: 'Transporte & Viagens',
    amount: 0.00,
    percentage: 0,
    color: '#8b5cf6',
    iconName: 'Car',
    budget: 600.00
  },
  {
    name: 'Outros & Lojas',
    amount: 0.00,
    percentage: 0,
    color: '#ec4899',
    iconName: 'ShoppingBag',
    budget: 500.00
  }
];

export const initialApiKeys: DeveloperApiKey[] = [
  {
    id: 'key-live-01',
    name: 'Chave de Produção',
    keyPrefix: 'lp_live_9f82••••••••••••••b1a4',
    fullKey: 'lp_live_9f82ad5b92014cd7b8c2e1f4099ab1a4',
    environment: 'production',
    createdAt: 'Hoje',
    lastUsed: 'Nunca'
  },
  {
    id: 'key-test-01',
    name: 'Sandbox de Testes',
    keyPrefix: 'lp_test_10bc••••••••••••••77fa',
    fullKey: 'lp_test_10bc441299837aefc0018843219077fa',
    environment: 'sandbox',
    createdAt: 'Hoje',
    lastUsed: 'Nunca'
  }
];

export const initialWebhooks: WebhookConfig[] = [];

export const apiEndpointsDoc = [
  {
    method: 'POST',
    path: '/v1/pix/charges',
    title: 'Criar Cobrança Pix Instantânea',
    description: 'Gera um QR Code dinâmico e código Copia e Cola com liquidação em menos de 1 segundo.',
    bodySample: {
      amount: 150.00,
      description: 'Pedido #4892 - E-commerce Store',
      expires_in_seconds: 3600,
      payer: {
        name: 'Carlos Oliveira',
        document: '29810291822'
      }
    },
    responseSample: {
      status: 'active',
      charge_id: 'ch_pix_98124091',
      qr_code_image: 'data:image/svg+xml;utf8,...',
      qr_code_payload: '00020126580014br.gov.bcb.pix0136leadspay-592...',
      amount: 150.00,
      created_at: '2026-09-22T15:20:00Z'
    }
  },
  {
    method: 'POST',
    path: '/v1/tap/payments',
    title: 'Autorizar Pagamento LeadsTap (NFC)',
    description: 'Processa pagamento por aproximação no smartphone sem necessidade de maquininha física.',
    bodySample: {
      amount: 85.00,
      modality: 'credit_single',
      installments: 1,
      device_serial: 'lp-phone-nfc-992'
    },
    responseSample: {
      status: 'approved',
      authorization_code: 'AUT882910',
      nsu: '99201948',
      amount: 85.00,
      settlement_date: '2026-09-22T15:21:04Z',
      fee_percentage: 0.0
    }
  },
  {
    method: 'GET',
    path: '/v1/balance',
    title: 'Consultar Saldo e Recebíveis em Tempo Real',
    description: 'Retorna o saldo disponível, saldo a liberar de LeadsTap e reservas financeiras.',
    bodySample: null,
    responseSample: {
      available_balance: 0.00,
      pending_tap_receivables: 0.00,
      currency: 'BRL',
      updated_at: '2026-09-22T15:21:04Z'
    }
  }
];

export const initialOnboardingSlides = [
  {
    id: 'slide-tap',
    tag: 'InfiniteTap / LeadsTap',
    title: 'Transforme seu celular em maquininha',
    subtitle: 'Grátis para CPF, CNPJ e MEI',
    description: 'Aproxime qualquer cartão ou smartphone e receba suas vendas na hora com segurança máxima.',
    image: '/src/assets/images/tap_to_pay_mobile_1790116091201.jpg',
    badge: 'Taxa Zero no 1º Mês'
  },
  {
    id: 'slide-lifestyle',
    tag: 'Simplicidade no Dia a Dia',
    title: 'Pague com simplicidade',
    subtitle: 'Uma experiência financeira feita para você',
    description: 'Pix em tempo real, cartão virtual dinâmico com CVV temporário e controle total dos seus gastos.',
    image: '/src/assets/images/lifestyle_card_terminal_1790116104071.jpg',
    badge: '100% Digital & Seguro'
  },
  {
    id: 'slide-future',
    tag: 'Tecnologia & Gestão',
    title: 'Gestão inteligente e API para parceiros',
    subtitle: 'Autenticação biométrica e suporte 24/7',
    description: 'Acompanhe seu fluxo de caixa em gráficos ao vivo e integre seus sistemas com nossa API bancária robusta.',
    image: '/src/assets/images/fintech_card_luxury_1790116114503.jpg',
    badge: 'Dev Portal Integrado'
  }
];
