import { describe, it, expect } from "vitest";
import { calculateCPM, calculateCTR, calculateCPC, calculateCostPerResult, deriveMetrics, formatCurrency, formatPercentage, formatNumber } from "../shared/metrics";

describe("Metrics Calculations", () => {
  describe("calculateCPM", () => {
    it("should calculate CPM correctly", () => {
      // CPM = (1935.02 / 137870) * 1000 = 14.04
      const result = calculateCPM(1935.02, 137870);
      expect(result).toBeCloseTo(14.04, 1);
    });

    it("should return 0 when impressions are 0", () => {
      const result = calculateCPM(100, 0);
      expect(result).toBe(0);
    });

    it("should handle decimal values", () => {
      const result = calculateCPM(50.5, 1000);
      expect(result).toBeCloseTo(50.5, 1);
    });
  });

  describe("calculateCTR", () => {
    it("should calculate CTR correctly", () => {
      // CTR = (2125 / 137870) * 100 = 1.54%
      const result = calculateCTR(2125, 137870);
      expect(result).toBeCloseTo(1.54, 1);
    });

    it("should return 0 when impressions are 0", () => {
      const result = calculateCTR(100, 0);
      expect(result).toBe(0);
    });

    it("should handle zero clicks", () => {
      const result = calculateCTR(0, 1000);
      expect(result).toBe(0);
    });
  });

  describe("calculateCPC", () => {
    it("should calculate CPC correctly", () => {
      // CPC = 1935.02 / 2125 = 0.91
      const result = calculateCPC(1935.02, 2125);
      expect(result).toBeCloseTo(0.91, 1);
    });

    it("should return 0 when clicks are 0", () => {
      const result = calculateCPC(100, 0);
      expect(result).toBe(0);
    });
  });

  describe("calculateCostPerResult", () => {
    it("should calculate cost per result correctly", () => {
      // 1178.30 / 2600 = 0.453
      const result = calculateCostPerResult(1178.30, 2600);
      expect(result).toBeCloseTo(0.45, 2);
    });

    it("should return 0 when count is 0 (sem denominador)", () => {
      expect(calculateCostPerResult(100, 0)).toBe(0);
    });

    it("should return 0 when count is negative or missing", () => {
      expect(calculateCostPerResult(100, -5)).toBe(0);
      expect(calculateCostPerResult(100, NaN)).toBe(0);
    });
  });

  describe("deriveMetrics", () => {
    it("deriva custo por visita quando zerado mas há gasto e visitas", () => {
      const out = deriveMetrics({
        totalSpent: 1178.30,
        instagramProfileVisits: 2600,
        costPerProfileVisit: 0,
      });
      expect(out.costPerProfileVisit).toBeCloseTo(0.45, 2);
    });

    it("preserva valor de custo já preenchido (não sobrescreve)", () => {
      const out = deriveMetrics({
        totalSpent: 1178.30,
        instagramProfileVisits: 2600,
        costPerProfileVisit: 0.99,
      });
      expect(out.costPerProfileVisit).toBe(0.99);
    });

    it("mantém 0 quando não há denominador (sem dados de referência)", () => {
      const out = deriveMetrics({
        totalSpent: 1178.30,
        instagramProfileVisits: 0,
        messagesInitiated: 0,
        purchases: 0,
        costPerProfileVisit: 0,
        costPerMessage: 0,
        costPerPurchase: 0,
      });
      expect(out.costPerProfileVisit).toBe(0);
      expect(out.costPerMessage).toBe(0);
      expect(out.costPerPurchase).toBe(0);
    });

    it("deriva CPM, CTR, CPC, custo por mensagem e por compra", () => {
      const out = deriveMetrics({
        totalSpent: 1000,
        totalImpressions: 100000,
        totalClicks: 2000,
        messagesInitiated: 500,
        purchases: 4,
        cpm: 0,
        ctr: 0,
        costPerClick: 0,
        costPerMessage: 0,
        costPerPurchase: 0,
      });
      expect(out.cpm).toBeCloseTo(10, 2);            // (1000/100000)*1000
      expect(out.ctr).toBeCloseTo(2, 2);             // (2000/100000)*100
      expect(out.costPerClick).toBeCloseTo(0.5, 2);  // 1000/2000
      expect(out.costPerMessage).toBeCloseTo(2, 2);  // 1000/500
      expect(out.costPerPurchase).toBeCloseTo(250, 2); // 1000/4
    });
  });

  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      const result = formatCurrency(1935.02);
      expect(result).toContain("R$");
      expect(result).toContain("1.935");
    });

    it("should handle zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("R$");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage correctly", () => {
      const result = formatPercentage(17.48);
      expect(result).toBe("17.48%");
    });

    it("should handle decimal values", () => {
      const result = formatPercentage(1.5342);
      expect(result).toBe("1.53%");
    });
  });

  describe("formatNumber", () => {
    it("should format number with thousands separator", () => {
      const result = formatNumber(137870);
      expect(result).toContain("137");
    });

    it("should handle zero", () => {
      const result = formatNumber(0);
      expect(result).toBe("0");
    });
  });
});
