/**
 * Taxas da LeadsTap — constantes nomeadas num só lugar.
 *
 * Regra confirmada pelo dono (24/10/2026):
 * - Mover o próprio dinheiro é GRÁTIS: carregar a conta, transferir entre
 *   contas próprias e Pix entre usuários LeadsTap custam zero.
 * - Taxa só existe na VENDA, e é UMA só, exibida antes (bruto -> taxa -> líquido).
 * - Saque na LeadsTap é R$ 0 (vantagem da migração; na LeadsPay sem migrar é R$ 2).
 *
 * Nenhum outro valor de taxa existe no app. Não invente taxas aqui.
 */

/** Carregar a própria conta (Pix interno / saldo interno). */
export const FEE_TOPUP_OWN_ACCOUNT_CENTS = 0;
/** Transferência entre contas próprias do mesmo usuário. */
export const FEE_OWN_TRANSFER_CENTS = 0;
/** Pix entre usuários LeadsTap. */
export const FEE_P2P_LEADSTAP_CENTS = 0;
/** Taxa única de venda do comerciante (taxa já estabelecida da LeadsPay). */
export const FEE_MERCHANT_SALE_CENTS = 99;
/** Saque na LeadsTap (migração): gratuito. */
export const FEE_WITHDRAWAL_LEADSTAP_CENTS = 0;
/** Saque na LeadsPay sem migrar: o valor que o usuário economiza ao migrar. */
export const FEE_WITHDRAWAL_LEADSPAY_CENTS = 200;
