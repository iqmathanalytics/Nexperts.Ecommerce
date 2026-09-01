export function toMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function discountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function applyCouponDiscount(input: {
  subtotal: number;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount?: number | null;
}): number {
  const raw =
    input.type === "PERCENTAGE" ? (input.subtotal * input.value) / 100 : input.value;
  const capped = input.maxDiscount != null ? Math.min(raw, input.maxDiscount) : raw;
  return toMoney(Math.max(0, Math.min(capped, input.subtotal)));
}

export function computeTotals(input: {
  subtotal: number;
  discount: number;
  taxRate: number;
  shipping: number;
}) {
  const taxable = Math.max(0, input.subtotal - input.discount);
  const tax = toMoney(taxable * input.taxRate);
  const total = toMoney(taxable + tax + input.shipping);
  return { tax, total, taxable };
}
