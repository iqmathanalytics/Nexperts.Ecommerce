import { env } from "../config/env";

export type PaymentResult = {
  provider: string;
  method: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  providerRef: string | null;
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: {
    orderNumber: string;
    amount: number;
    method: string;
  }): Promise<PaymentResult>;
}

export class CodProvider implements PaymentProvider {
  readonly name = "cod";
  async createPayment(input: { orderNumber: string; amount: number; method: string }): Promise<PaymentResult> {
    return {
      provider: this.name,
      method: input.method || "COD",
      status: "PENDING",
      providerRef: `COD-${input.orderNumber}`,
      metadata: { amount: input.amount },
    };
  }
}

/** Generic online placeholder when provider is not razorpay. */
export class OnlineReadyProvider implements PaymentProvider {
  readonly name = "online";
  async createPayment(input: { orderNumber: string; amount: number; method: string }): Promise<PaymentResult> {
    return {
      provider: this.name,
      method: input.method || "ONLINE",
      status: "PENDING",
      providerRef: null,
      metadata: {
        amount: input.amount,
        note: "Configure PAYMENT_PROVIDER=razorpay with PAYMENT_KEY and PAYMENT_SECRET.",
      },
    };
  }
}

/** Creates a Razorpay order server-side. Webhook verification is a follow-up step. */
export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  async createPayment(input: { orderNumber: string; amount: number; method: string }): Promise<PaymentResult> {
    const auth = Buffer.from(`${env.PAYMENT_KEY}:${env.PAYMENT_SECRET}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(input.amount * 100),
        currency: "INR",
        receipt: input.orderNumber,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Razorpay order failed (${res.status}): ${body}`);
    }
    const data = (await res.json()) as { id: string };
    return {
      provider: this.name,
      method: input.method || "ONLINE",
      status: "PENDING",
      providerRef: data.id,
      metadata: { razorpayOrderId: data.id, amount: input.amount },
    };
  }
}

export function isOnlinePaymentEnabled() {
  if (!env.PAYMENT_KEY || !env.PAYMENT_SECRET) return false;
  return env.PAYMENT_PROVIDER === "razorpay" || env.PAYMENT_PROVIDER === "online";
}

export function getPaymentProvider(method: string): PaymentProvider {
  if (method === "ONLINE") {
    if (!isOnlinePaymentEnabled()) {
      throw new Error("Online payment is not configured");
    }
    if (env.PAYMENT_PROVIDER === "razorpay") return new RazorpayProvider();
    return new OnlineReadyProvider();
  }
  return new CodProvider();
}
