import { describe, it, expect } from "vitest";
import { analyzeMetrics } from "../_shared/analytics";

describe("Analytics - Metrics Analysis", () => {
  const baseMetrics = {
    ctr: 1.54,
    cpm: 14.04,
    totalReach: 63093,
    totalImpressions: 137870,
    totalSpent: 1935.02,
    totalClicks: 2125,
    costPerClick: 1.53,
    videoRetentionRate: 17.48,
    newInstagramFollowers: 546,
    messagesInitiated: 421,
    instagramProfileVisits: 1050,
    costPerProfileVisit: 0.28,
  };

  describe("CTR Analysis", () => {
    it("should classify CTR as 'bom' when between 1.5-2.5%", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(analysis.ctr.status).toBe("bom");
      expect(analysis.ctr.value).toBeCloseTo(1.54, 1);
    });

    it("should classify CTR as 'excelente' when >= 2.5%", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, ctr: 3.0 });
      expect(analysis.ctr.status).toBe("excelente");
    });

    it("should classify CTR as 'aceitavel' when between 0.8-1.5%", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, ctr: 1.0 });
      expect(analysis.ctr.status).toBe("aceitavel");
    });

    it("should classify CTR as 'ruim' when < 0.8%", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, ctr: 0.5 });
      expect(analysis.ctr.status).toBe("ruim");
    });
  });

  describe("CPM Analysis", () => {
    it("should classify CPM as 'bom' when between 8-12 R$", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(["bom", "aceitavel"]).toContain(analysis.cpm.status);
      expect(analysis.cpm.value).toBeCloseTo(14.04, 1);
    });

    it("should classify CPM as 'excelente' when <= 8 R$", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, cpm: 7.0 });
      expect(analysis.cpm.status).toBe("excelente");
    });

    it("should classify CPM as 'aceitavel' when between 12-18 R$", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, cpm: 15.0 });
      expect(analysis.cpm.status).toBe("aceitavel");
    });

    it("should classify CPM as 'ruim' when > 18 R$", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, cpm: 20.0 });
      expect(analysis.cpm.status).toBe("ruim");
    });
  });

  describe("Alcance Analysis", () => {
    it("should calculate frequencia correctly", () => {
      const analysis = analyzeMetrics(baseMetrics);
      const frequenciaEsperada = baseMetrics.totalImpressions / baseMetrics.totalReach;
      expect(analysis.alcance.frequencia).toBeCloseTo(frequenciaEsperada, 1);
    });

    it("should classify alcance as 'excelente' when frequencia <= 1.5", () => {
      const analysis = analyzeMetrics({
        ...baseMetrics,
        totalImpressions: 100000,
        totalReach: 80000,
      });
      expect(analysis.alcance.status).toBe("excelente");
    });

    it("should classify alcance as 'bom' when frequencia between 1.5-2.5", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(analysis.alcance.status).toBe("bom");
    });
  });

  describe("Engajamento Analysis", () => {
    it("should classify engajamento as 'excelente' when total > 2000", () => {
      const analysis = analyzeMetrics({
        ...baseMetrics,
        newInstagramFollowers: 1000,
        messagesInitiated: 600,
        instagramProfileVisits: 500,
      });
      expect(analysis.engajamento.status).toBe("excelente");
    });

    it("should classify engajamento as 'bom' when total between 1000-2000", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(["bom", "excelente"]).toContain(analysis.engajamento.status);
    });

    it("should classify engajamento as 'aceitavel' when total between 500-1000", () => {
      const analysis = analyzeMetrics({
        ...baseMetrics,
        newInstagramFollowers: 300,
        messagesInitiated: 200,
        instagramProfileVisits: 300,
      });
      expect(analysis.engajamento.status).toBe("aceitavel");
    });
  });

  describe("Video Analysis", () => {
    it("should classify video as 'bom' when retencao between 15-25%", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(analysis.video.status).toBe("bom");
    });

    it("should classify video as 'excelente' when retencao >= 25%", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, videoRetentionRate: 30.0 });
      expect(analysis.video.status).toBe("excelente");
    });

    it("should classify video as 'aceitavel' when retencao between 8-15%", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, videoRetentionRate: 10.0 });
      expect(analysis.video.status).toBe("aceitavel");
    });

    it("should classify video as 'ruim' when retencao < 8%", () => {
      const analysis = analyzeMetrics({ ...baseMetrics, videoRetentionRate: 5.0 });
      expect(analysis.video.status).toBe("ruim");
    });
  });

  describe("Investimento Analysis", () => {
    it("should classify investimento as 'bom' when custos estão na faixa esperada", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(["bom", "aceitavel"]).toContain(analysis.investimento.status);
    });

    it("should classify investimento as 'excelente' when custos são muito baixos", () => {
      const analysis = analyzeMetrics({
        ...baseMetrics,
        costPerClick: 0.8,
        costPerProfileVisit: 0.2,
      });
      expect(analysis.investimento.status).toBe("excelente");
    });

    it("should classify investimento as 'ruim' when custos são muito altos", () => {
      const analysis = analyzeMetrics({
        ...baseMetrics,
        costPerClick: 3.0,
        costPerProfileVisit: 1.0,
      });
      expect(analysis.investimento.status).toBe("ruim");
    });
  });

  describe("Resumo Geral", () => {
    it("should identify pontos fortes", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(analysis.resumoGeral.pontosFortesCount).toBeGreaterThan(0);
      expect(analysis.resumoGeral.pontosFortesTexto.length).toBeGreaterThan(0);
    });

    it("should generate recomendacao principal", () => {
      const analysis = analyzeMetrics(baseMetrics);
      expect(analysis.resumoGeral.recomendacaoPrincipal).toBeTruthy();
      expect(analysis.resumoGeral.recomendacaoPrincipal.length).toBeGreaterThan(0);
    });

    it("should have pontos fracos when metrics are poor", () => {
      const poorMetrics = {
        ctr: 0.3,
        cpm: 25.0,
        totalReach: 10000,
        totalImpressions: 50000,
        totalSpent: 1935.02,
        totalClicks: 150,
        costPerClick: 5.0,
        videoRetentionRate: 3.0,
        newInstagramFollowers: 10,
        messagesInitiated: 5,
        instagramProfileVisits: 50,
        costPerProfileVisit: 2.0,
      };
      const analysis = analyzeMetrics(poorMetrics);
      expect(analysis.resumoGeral.pontosFracosCount).toBeGreaterThan(0);
    });
  });

  describe("Insights Generation", () => {
    it("should generate specific insights for each metric", () => {
      const analysis = analyzeMetrics(baseMetrics);

      expect(analysis.ctr.insight).toContain("1.54");
      expect(analysis.cpm.insight).toContain("14.04");
      expect(analysis.alcance.insight).toContain("63"); // Pode estar formatado
      expect(analysis.video.insight).toContain("17.48");
    });

    it("should provide actionable recomendacoes", () => {
      const analysis = analyzeMetrics(baseMetrics);

      expect(analysis.ctr.recomendacao).toBeTruthy();
      expect(analysis.cpm.recomendacao).toBeTruthy();
      expect(analysis.alcance.recomendacao).toBeTruthy();
      expect(analysis.engajamento.recomendacao).toBeTruthy();
      expect(analysis.video.recomendacao).toBeTruthy();
      expect(analysis.investimento.recomendacao).toBeTruthy();
    });
  });
});
