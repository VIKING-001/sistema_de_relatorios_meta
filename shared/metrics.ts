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
 * Calcula Custo por Resultado genérico (visita, mensagem, compra, etc)
 * Custo = Gasto Total / Quantidade de resultados
 * Retorna 0 quando não há denominador (sem dados de referência)
 */
export function calculateCostPerResult(totalSpent: number, count: number): number {
  if (!count || count <= 0) return 0;
  return totalSpent / count;
}

/**
 * Campos numéricos de métricas usados na derivação de custos.
 * Todos opcionais para tolerar objetos com formatos diferentes.
 */
export interface DerivableMetrics {
  totalSpent?: number;
  totalImpressions?: number;
  totalClicks?: number;
  instagramProfileVisits?: number;
  messagesInitiated?: number;
  purchases?: number;
  cpm?: number;
  ctr?: number;
  costPerClick?: number;
  costPerProfileVisit?: number;
  costPerMessage?: number;
  costPerPurchase?: number;
  [key: string]: unknown;
}

/**
 * Preenche automaticamente os campos de custo derivados quando estão zerados
 * mas há dados suficientes para calcular (gasto ÷ denominador — uma média).
 *
 * Regra: só calcula quando o valor atual é 0/ausente E o denominador é > 0.
 * Valores já preenchidos (≠ 0) são preservados — mantêm o número exato
 * informado pelo admin/Meta. Campos sem denominador continuam 0.
 */
export function deriveMetrics<T extends DerivableMetrics>(m: T): T {
  const totalSpent       = Number(m.totalSpent ?? 0) || 0;
  const totalImpressions = Number(m.totalImpressions ?? 0) || 0;
  const totalClicks      = Number(m.totalClicks ?? 0) || 0;
  const profileVisits    = Number(m.instagramProfileVisits ?? 0) || 0;
  const messages         = Number(m.messagesInitiated ?? 0) || 0;
  const purchases        = Number(m.purchases ?? 0) || 0;

  // Mantém o valor existente se já for > 0, senão deriva
  const keep = (current: unknown, derived: number) => {
    const v = Number(current ?? 0) || 0;
    return v > 0 ? v : derived;
  };

  return {
    ...m,
    cpm:                 keep(m.cpm,                 calculateCPM(totalSpent, totalImpressions)),
    ctr:                 keep(m.ctr,                 calculateCTR(totalClicks, totalImpressions)),
    costPerClick:        keep(m.costPerClick,        calculateCPC(totalSpent, totalClicks)),
    costPerProfileVisit: keep(m.costPerProfileVisit, calculateCostPerResult(totalSpent, profileVisits)),
    costPerMessage:      keep(m.costPerMessage,      calculateCostPerResult(totalSpent, messages)),
    costPerPurchase:     keep(m.costPerPurchase,     calculateCostPerResult(totalSpent, purchases)),
  };
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
