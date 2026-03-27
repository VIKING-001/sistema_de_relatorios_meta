/**
 * Utilitários para cálculo de métricas derivadas de campanhas Meta
 */

export interface MetricsInput {
  totalImpressions: number;
  totalSpent: number;
  totalClicks: number;
}

/**
 * Calcula CPM (Custo por 1000 impressões)
 * CPM = (Custo Total / Impressões) * 1000
 */
export function calculateCPM(totalSpent: number, totalImpressions: number): number {
  if (totalImpressions === 0) return 0;
  return (totalSpent / totalImpressions) * 1000;
}

/**
 * Calcula CTR (Taxa de Cliques no Link)
 * CTR = (Cliques / Impressões) * 100
 */
export function calculateCTR(totalClicks: number, totalImpressions: number): number {
  if (totalImpressions === 0) return 0;
  return (totalClicks / totalImpressions) * 100;
}

/**
 * Calcula Custo por Clique
 * CPC = Custo Total / Cliques
 */
export function calculateCPC(totalSpent: number, totalClicks: number): number {
  if (totalClicks === 0) return 0;
  return totalSpent / totalClicks;
}

/**
 * Formata valor monetário em Real
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata percentual com 2 casas decimais
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Valida se um valor é um número válido
 */
export function isValidNumber(value: unknown): boolean {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Converte string para número com validação
 */
export function parseNumber(value: string | number): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isValidNumber(num) ? num : 0;
}
