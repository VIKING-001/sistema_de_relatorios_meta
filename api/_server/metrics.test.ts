import { describe, it, expect } from "vitest";
import { calculateCPM, calculateCTR, calculateCPC, formatCurrency, formatPercentage, formatNumber } from "../_shared/metrics";

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
