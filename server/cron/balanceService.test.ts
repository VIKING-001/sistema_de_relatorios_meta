import { describe, expect, it } from "vitest";
import { isAtOrBelowThreshold, parsePrepayAccountBalance } from "./balanceService";

describe("Meta prepaid balance alerts", () => {
  it("uses Meta's hundredths value as cents without multiplying twice", () => {
    expect(parsePrepayAccountBalance({
      currency: "BRL",
      is_prepay_account: true,
      prepay_account_balance: {
        amount: "100.00",
        amount_in_hundredths: "10000",
        currency: "BRL",
      },
    })).toEqual({ status: "ok", balanceCents: 10000, currency: "BRL" });
  });

  it("supports the major-unit amount when hundredths are absent", () => {
    expect(parsePrepayAccountBalance({
      currency: "BRL",
      is_prepay_account: true,
      prepay_account_balance: { amount: "87.45", currency: "BRL" },
    })).toEqual({ status: "ok", balanceCents: 8745, currency: "BRL" });
  });

  it("does not mistake the bill due field for available prepaid funds", () => {
    expect(parsePrepayAccountBalance({
      currency: "BRL",
      is_prepay_account: true,
      balance: "50000",
    })).toMatchObject({ status: "error" });
  });

  it("skips postpaid accounts and non-BRL balances", () => {
    expect(parsePrepayAccountBalance({
      currency: "BRL",
      is_prepay_account: false,
      balance: "0",
    })).toMatchObject({ status: "not_prepaid" });
    expect(parsePrepayAccountBalance({
      currency: "USD",
      is_prepay_account: true,
      prepay_account_balance: { amount_in_hundredths: "10000", currency: "USD" },
    })).toMatchObject({ status: "currency_mismatch" });
  });

  it("alerts at exactly the configured threshold", () => {
    expect(isAtOrBelowThreshold(10000, 10000)).toBe(true);
    expect(isAtOrBelowThreshold(10001, 10000)).toBe(false);
  });
});
