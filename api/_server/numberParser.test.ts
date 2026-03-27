import { describe, it, expect } from "vitest";
import {
  parseBrazilianNumber,
  formatBrazilianNumber,
  isValidBrazilianNumber,
  maskBrazilianNumber,
  maskBrazilianNumberWithDecimals,
} from "../_shared/numberParser";

describe("Brazilian Number Parser", () => {
  describe("parseBrazilianNumber", () => {
    it("should parse simple numbers", () => {
      expect(parseBrazilianNumber("123")).toBe(123);
      expect(parseBrazilianNumber(123)).toBe(123);
    });

    it("should parse numbers with thousands separator (dot)", () => {
      expect(parseBrazilianNumber("1.000")).toBe(1000);
      expect(parseBrazilianNumber("85.380")).toBe(85380);
      expect(parseBrazilianNumber("1.000.800")).toBe(1000800);
      expect(parseBrazilianNumber("80.000.384")).toBe(80000384);
    });

    it("should parse numbers with decimal separator (comma)", () => {
      expect(parseBrazilianNumber("1.000,50")).toBe(1000.5);
      expect(parseBrazilianNumber("85.380,99")).toBe(85380.99);
      expect(parseBrazilianNumber("1.000.800,50")).toBe(1000800.5);
      expect(parseBrazilianNumber("80.000.384,25")).toBe(80000384.25);
    });

    it("should parse numbers with only comma as decimal", () => {
      expect(parseBrazilianNumber("1000,50")).toBe(1000.5);
      expect(parseBrazilianNumber("123,45")).toBe(123.45);
    });

    it("should parse numbers with only dot as thousands separator", () => {
      expect(parseBrazilianNumber("1.000")).toBe(1000);
      expect(parseBrazilianNumber("123.456")).toBe(123456);
    });

    it("should handle edge cases", () => {
      expect(parseBrazilianNumber("")).toBe(0);
      expect(parseBrazilianNumber("0")).toBe(0);
      expect(parseBrazilianNumber("0,00")).toBe(0);
      expect(parseBrazilianNumber("0.000,00")).toBe(0);
    });

    it("should handle whitespace", () => {
      expect(parseBrazilianNumber("  1.000  ")).toBe(1000);
      expect(parseBrazilianNumber("  85.380,99  ")).toBe(85380.99);
    });

    it("should handle real-world examples from the issue", () => {
      expect(parseBrazilianNumber("80.000.800")).toBe(80000800);
      expect(parseBrazilianNumber("85.380")).toBe(85380);
      expect(parseBrazilianNumber("1.935,02")).toBe(1935.02);
    });
  });

  describe("formatBrazilianNumber", () => {
    it("should format numbers to Brazilian standard", () => {
      expect(formatBrazilianNumber(1000)).toBe("1.000,00");
      expect(formatBrazilianNumber(85380)).toBe("85.380,00");
      expect(formatBrazilianNumber(1000800)).toBe("1.000.800,00");
      expect(formatBrazilianNumber(80000384)).toBe("80.000.384,00");
    });

    it("should format with correct decimal places", () => {
      expect(formatBrazilianNumber(1000.5, 2)).toBe("1.000,50");
      expect(formatBrazilianNumber(85380.99, 2)).toBe("85.380,99");
      expect(formatBrazilianNumber(1000800.5, 2)).toBe("1.000.800,50");
    });

    it("should format with custom decimal places", () => {
      expect(formatBrazilianNumber(1000.5, 0)).toBe("1.001");
      expect(formatBrazilianNumber(1000.5, 1)).toBe("1.000,5");
      expect(formatBrazilianNumber(1000.5, 3)).toBe("1.000,500");
    });

    it("should handle zero", () => {
      expect(formatBrazilianNumber(0)).toBe("0,00");
      expect(formatBrazilianNumber(0, 0)).toBe("0");
    });
  });

  describe("isValidBrazilianNumber", () => {
    it("should validate correct Brazilian numbers", () => {
      expect(isValidBrazilianNumber("1.000")).toBe(true);
      expect(isValidBrazilianNumber("85.380")).toBe(true);
      expect(isValidBrazilianNumber("1.000.800")).toBe(true);
      expect(isValidBrazilianNumber("1.000,50")).toBe(true);
      expect(isValidBrazilianNumber("85.380,99")).toBe(true);
    });

    it("should reject invalid inputs", () => {
      expect(isValidBrazilianNumber("")).toBe(false);
      expect(isValidBrazilianNumber("abc")).toBe(false);
      expect(isValidBrazilianNumber("1.000.800.900.000,50")).toBe(true); // Valid format
    });

    it("should handle edge cases", () => {
      expect(isValidBrazilianNumber("0")).toBe(true);
      expect(isValidBrazilianNumber("0,00")).toBe(true);
      expect(isValidBrazilianNumber("  1.000  ")).toBe(true);
    });
  });

  describe("maskBrazilianNumber", () => {
    it("should mask numbers while typing", () => {
      expect(maskBrazilianNumber("1")).toBe("1");
      expect(maskBrazilianNumber("12")).toBe("12");
      expect(maskBrazilianNumber("123")).toBe("123");
      expect(maskBrazilianNumber("1234")).toBe("1.234");
      expect(maskBrazilianNumber("12345")).toBe("12.345");
      expect(maskBrazilianNumber("123456")).toBe("123.456");
      expect(maskBrazilianNumber("1234567")).toBe("1.234.567");
    });

    it("should handle real-world examples", () => {
      expect(maskBrazilianNumber("80000800")).toBe("80.000.800");
      expect(maskBrazilianNumber("85380")).toBe("85.380");
      expect(maskBrazilianNumber("193502")).toBe("193.502");
    });

    it("should remove non-numeric characters", () => {
      expect(maskBrazilianNumber("1.234")).toBe("1.234");
      expect(maskBrazilianNumber("1,234")).toBe("1.234");
      expect(maskBrazilianNumber("1.2.3.4")).toBe("1.234");
    });
  });

  describe("maskBrazilianNumberWithDecimals", () => {
    it("should mask numbers with decimals while typing", () => {
      expect(maskBrazilianNumberWithDecimals("1")).toBe("0,01");
      expect(maskBrazilianNumberWithDecimals("12")).toBe("0,12");
      expect(maskBrazilianNumberWithDecimals("123")).toBe("1,23");
      expect(maskBrazilianNumberWithDecimals("1234")).toBe("12,34");
      expect(maskBrazilianNumberWithDecimals("12345")).toBe("123,45");
      expect(maskBrazilianNumberWithDecimals("123456")).toBe("1.234,56");
      expect(maskBrazilianNumberWithDecimals("1234567")).toBe("12.345,67");
    });

    it("should handle real-world examples", () => {
      expect(maskBrazilianNumberWithDecimals("80000800")).toBe("800.008,00");
      expect(maskBrazilianNumberWithDecimals("193502")).toBe("1.935,02");
    });

    it("should remove non-numeric characters", () => {
      expect(maskBrazilianNumberWithDecimals("1.234,56")).toBe("1.234,56"); // Keeps valid format
      expect(maskBrazilianNumberWithDecimals("1,234")).toBe("12,34"); // Removes comma, treats as 1234
    });
  });

  describe("Integration tests", () => {
    it("should parse formatted numbers correctly", () => {
      const formatted = formatBrazilianNumber(80000800, 2);
      const parsed = parseBrazilianNumber(formatted);
      expect(parsed).toBe(80000800);
    });

    it("should handle round-trip conversion", () => {
      const original = 1000800.5;
      const formatted = formatBrazilianNumber(original, 2);
      const parsed = parseBrazilianNumber(formatted);
      expect(parsed).toBeCloseTo(original, 2);
    });

    it("should work with real campaign data", () => {
      // Dados do exemplo do usuário
      const alcance = parseBrazilianNumber("63.093");
      const impressoes = parseBrazilianNumber("137.870");
      const gasto = parseBrazilianNumber("1.935,02");
      const cliques = parseBrazilianNumber("2.125");

      expect(alcance).toBe(63093);
      expect(impressoes).toBe(137870);
      expect(gasto).toBe(1935.02);
      expect(cliques).toBe(2125);
    });
  });
});
