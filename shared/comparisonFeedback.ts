import { formatCurrency, formatNumber } from "./metrics";

export type ComparisonMetrics = {
  spend: number;
  purchases: number;
  revenue: number;
  roas: number;
  messages: number;
};

export type ComparisonFeedback = {
  results: string;
  interpretation: string;
};

function formatRoas(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}x`;
}

function describeChange(
  before: number,
  after: number,
  format: (value: number) => string,
  increaseVerb: string,
  decreaseVerb: string
) {
  if (before === after) return `permaneceu em ${format(after)}`;
  if (before === 0) return `passou de ${format(before)} para ${format(after)}`;

  const change = Math.abs(((after - before) / before) * 100);
  const percentage = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(change);

  return `${after > before ? increaseVerb : decreaseVerb} ${percentage}% (de ${format(before)} para ${format(after)})`;
}

export function buildComparisonFeedback(
  before: ComparisonMetrics,
  after: ComparisonMetrics
): ComparisonFeedback {
  const results = [
    `Faturamento ${describeChange(before.revenue, after.revenue, formatCurrency, "aumentou", "diminuiu")}`,
    `compras ${describeChange(before.purchases, after.purchases, formatNumber, "aumentaram", "diminuíram")}`,
    `investimento ${describeChange(before.spend, after.spend, formatCurrency, "aumentou", "diminuiu")}`,
    `ROAS ${describeChange(before.roas, after.roas, formatRoas, "aumentou", "diminuiu")}`,
  ].join("; ");

  const hasPreviousSales = before.purchases > 0 || before.revenue > 0;
  const hasCurrentSales = after.purchases > 0 || after.revenue > 0;
  let interpretation: string;

  if (!hasCurrentSales) {
    interpretation = hasPreviousSales
      ? "Não há compras ou faturamento registrados no período atual. Confira os dados de vendas antes de concluir se o retorno caiu."
      : before.messages > 0 || after.messages > 0
        ? "Ainda não há vendas registradas nos períodos selecionados. O comparativo mostra investimento e conversas, mas não permite avaliar o retorno em faturamento."
        : "Ainda não há vendas registradas nos períodos selecionados para avaliar o retorno em faturamento.";
  } else if (!hasPreviousSales) {
    interpretation =
      "O período atual passou a ter vendas registradas; como o período anterior não tem essa base, ainda não é possível afirmar crescimento ou queda do retorno.";
  } else if (after.roas > before.roas) {
    interpretation =
      after.revenue >= before.revenue
        ? "O retorno por real investido melhorou e o faturamento não recuou."
        : "O retorno por real investido melhorou, embora o faturamento tenha recuado.";
  } else if (after.roas < before.roas) {
    interpretation =
      after.revenue > before.revenue
        ? "O faturamento cresceu, mas o retorno por real investido caiu; houve mais receita com menor eficiência."
        : "O faturamento e o retorno por real investido recuaram. Vale revisar a estratégia antes de ampliar o investimento.";
  } else {
    interpretation =
      "O retorno por real investido permaneceu estável entre os períodos.";
  }

  return { results, interpretation };
}
