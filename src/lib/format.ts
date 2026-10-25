/** Formata centavos como BRL: 12345 -> "R$ 123,45". */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/** Apenas o número formatado, sem o símbolo: 12345 -> "123,45". */
export function formatBRLNumber(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte texto digitado ("1.234,56", "1234.56", "85", "85,00") em centavos.
 * Retorna null quando o texto não é um valor monetário válido.
 */
export function parseBRLToCents(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, '');
  if (!cleaned) return null;
  // Milhares com ponto + decimais com vírgula, ou decimais com ponto.
  let normalized = cleaned;
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Math.round(parseFloat(normalized) * 100);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/** Normaliza uma chave Pix para lookup: sem espaços, minúscula. */
export function normalizePixKey(key: string): string {
  return key.trim().toLowerCase();
}

/** Data/hora legível a partir de um Timestamp do Firestore (ou null). */
export function formatTimestamp(
  ts: { toDate?: () => Date; seconds?: number } | null | undefined,
): string {
  if (!ts) return '';
  try {
    const date = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
    return (
      date.toLocaleDateString('pt-BR') +
      ' às ' +
      date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return '';
  }
}
