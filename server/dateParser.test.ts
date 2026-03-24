import { describe, it, expect } from "vitest";
import { parseLocalDate, formatLocalDate, isValidDateString } from "../shared/dateParser";

describe("Date Parser", () => {
  describe("parseLocalDate", () => {
    it("should parse valid date strings correctly", () => {
      const date = parseLocalDate("2026-01-31");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(31);
    });

    it("should parse February dates correctly", () => {
      const date = parseLocalDate("2026-02-27");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(1); // February is 1
      expect(date.getDate()).toBe(27);
    });

    it("should parse December dates correctly", () => {
      const date = parseLocalDate("2026-12-31");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(11); // December is 11
      expect(date.getDate()).toBe(31);
    });

    it("should set time to midnight", () => {
      const date = parseLocalDate("2026-01-31");
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
    });

    it("should handle invalid inputs gracefully", () => {
      const result1 = parseLocalDate("");
      expect(isNaN(result1.getTime())).toBe(true);

      const result2 = parseLocalDate("invalid");
      expect(isNaN(result2.getTime())).toBe(true);

      const result3 = parseLocalDate("2026-13-01");
      expect(isNaN(result3.getTime())).toBe(true);
    });
  });

  describe("formatLocalDate", () => {
    it("should format dates to ISO string", () => {
      const date = new Date(2026, 0, 31); // January 31, 2026
      expect(formatLocalDate(date)).toBe("2026-01-31");
    });

    it("should pad month and day with zeros", () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(formatLocalDate(date)).toBe("2026-01-05");
    });

    it("should handle December correctly", () => {
      const date = new Date(2026, 11, 31); // December 31, 2026
      expect(formatLocalDate(date)).toBe("2026-12-31");
    });
  });

  describe("isValidDateString", () => {
    it("should validate correct date strings", () => {
      expect(isValidDateString("2026-01-31")).toBe(true);
      expect(isValidDateString("2026-02-27")).toBe(true);
      expect(isValidDateString("2026-12-31")).toBe(true);
      expect(isValidDateString("2000-01-01")).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidDateString("31/01/2026")).toBe(false);
      expect(isValidDateString("01-31-2026")).toBe(false);
      expect(isValidDateString("2026/01/31")).toBe(false);
      expect(isValidDateString("")).toBe(false);
      expect(isValidDateString("invalid")).toBe(false);
    });

    it("should reject invalid months", () => {
      expect(isValidDateString("2026-00-01")).toBe(false);
      expect(isValidDateString("2026-13-01")).toBe(false);
    });

    it("should reject invalid days", () => {
      expect(isValidDateString("2026-01-00")).toBe(false);
      expect(isValidDateString("2026-01-32")).toBe(false);
    });
  });

  describe("Round-trip conversion", () => {
    it("should preserve dates through parse and format", () => {
      const original = "2026-01-31";
      const parsed = parseLocalDate(original);
      const formatted = formatLocalDate(parsed);
      expect(formatted).toBe(original);
    });

    it("should handle various dates", () => {
      const dates = ["2026-01-01", "2026-02-28", "2026-12-31", "2000-06-15"];
      dates.forEach((dateStr) => {
        const parsed = parseLocalDate(dateStr);
        const formatted = formatLocalDate(parsed);
        expect(formatted).toBe(dateStr);
      });
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle campaign period from user example", () => {
      const startDate = parseLocalDate("2026-01-31");
      const endDate = parseLocalDate("2026-02-27");

      expect(startDate.getFullYear()).toBe(2026);
      expect(startDate.getMonth()).toBe(0);
      expect(startDate.getDate()).toBe(31);

      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(1);
      expect(endDate.getDate()).toBe(27);

      // Verify end date is after start date
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it("should handle March campaign period", () => {
      const startDate = parseLocalDate("2026-02-28");
      const endDate = parseLocalDate("2026-03-23");

      expect(startDate.getMonth()).toBe(1); // February
      expect(endDate.getMonth()).toBe(2); // March
    });
  });
});
