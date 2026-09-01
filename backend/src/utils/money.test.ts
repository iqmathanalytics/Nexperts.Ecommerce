import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyCouponDiscount, computeTotals, discountPercent, toMoney } from "./money";

describe("toMoney", () => {
  it("rounds to two decimals", () => {
    assert.equal(toMoney(10.556), 10.56);
    assert.equal(toMoney("99.994"), 99.99);
  });
});

describe("discountPercent", () => {
  it("returns zero when price is not below mrp", () => {
    assert.equal(discountPercent(100, 100), 0);
    assert.equal(discountPercent(0, 50), 0);
  });

  it("calculates percentage off", () => {
    assert.equal(discountPercent(100, 75), 25);
  });
});

describe("applyCouponDiscount", () => {
  it("applies percentage with cap", () => {
    assert.equal(
      applyCouponDiscount({ subtotal: 1000, type: "PERCENTAGE", value: 10, maxDiscount: 50 }),
      50,
    );
  });

  it("applies fixed discount up to subtotal", () => {
    assert.equal(applyCouponDiscount({ subtotal: 200, type: "FIXED", value: 500 }), 200);
  });
});

describe("computeTotals", () => {
  it("computes tax and total", () => {
    const result = computeTotals({ subtotal: 1000, discount: 100, taxRate: 0.18, shipping: 49 });
    assert.equal(result.taxable, 900);
    assert.equal(result.tax, 162);
    assert.equal(result.total, 1111);
  });
});
