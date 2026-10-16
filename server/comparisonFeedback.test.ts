import { describe, expect, it } from "vitest";
import { buildComparisonFeedback } from "../shared/comparisonFeedback";

describe("buildComparisonFeedback", () => {
  it("interpreta melhora conjunta de faturamento e retorno", () => {
    const feedback = buildComparisonFeedback(
      { spend: 500, purchases: 10, revenue: 1500, roas: 3, messages: 20 },
      { spend: 600, purchases: 14, revenue: 2400, roas: 4, messages: 25 }
    );

    expect(feedback.results).toContain("Faturamento aumentou 60%");
    expect(feedback.interpretation).toContain(
      "melhorou e o faturamento não recuou"
    );
  });

  it("explica quando faturamento cresce mas eficiência cai", () => {
    const feedback = buildComparisonFeedback(
      { spend: 500, purchases: 10, revenue: 1500, roas: 3, messages: 20 },
      { spend: 900, purchases: 12, revenue: 1800, roas: 2, messages: 28 }
    );

    expect(feedback.interpretation).toContain(
      "O faturamento cresceu, mas o retorno"
    );
  });

  it("não conclui retorno quando o período atual não tem vendas", () => {
    const feedback = buildComparisonFeedback(
      { spend: 500, purchases: 10, revenue: 1500, roas: 3, messages: 20 },
      { spend: 400, purchases: 0, revenue: 0, roas: 0, messages: 18 }
    );

    expect(feedback.interpretation).toContain("Confira os dados de vendas");
  });
});
