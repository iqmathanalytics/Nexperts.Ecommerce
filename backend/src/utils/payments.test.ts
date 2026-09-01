import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CodProvider } from "./payments";

describe("CodProvider", () => {
  it("creates pending COD payment", async () => {
    const provider = new CodProvider();
    const result = await provider.createPayment({ orderNumber: "ORD-2026-000001", amount: 999, method: "COD" });
    assert.equal(result.status, "PENDING");
    assert.equal(result.providerRef, "COD-ORD-2026-000001");
    assert.equal(result.method, "COD");
  });
});
