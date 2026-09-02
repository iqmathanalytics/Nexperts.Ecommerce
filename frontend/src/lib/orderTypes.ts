export type OrderAddress = {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type OrderLine = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  sku: string;
  variantName?: string;
  imageUrl?: string | null;
};

export type OrderPayment = {
  id: number;
  method: string;
  status: string;
  amount: string | number;
  provider?: string;
};

export type OrderHistory = {
  id: number;
  toStatus: string;
  createdAt: string;
  note: string | null;
};

export type CustomerOrder = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string | number;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  shipping: string | number;
  couponCode?: string | null;
  createdAt: string;
  shippingAddress?: OrderAddress;
  items: OrderLine[];
  history: OrderHistory[];
  payments?: OrderPayment[];
};

export function asAmount(value: string | number | undefined) {
  return Number(value ?? 0);
}

export function formatAddress(addr?: OrderAddress | null) {
  if (!addr) return "";
  return [addr.line1, addr.line2, `${addr.city ?? ""}${addr.state ? `, ${addr.state}` : ""} ${addr.postalCode ?? ""}`.trim(), addr.country]
    .filter(Boolean)
    .join(", ");
}
