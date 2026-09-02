export const ORDER_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] as const;

/** Customer-facing milestones — mirrors admin updates */
export const TRACKING_STEPS = [
  {
    id: "ORDERED",
    label: "Ordered",
    title: "Order placed",
    description: "We received your order.",
  },
  {
    id: "PREPARING",
    label: "Preparing",
    title: "Preparing",
    description: "Your order is confirmed and being prepared.",
  },
  {
    id: "PACKED",
    label: "Packed",
    title: "Packed",
    description: "Your items are packed and ready to ship.",
  },
  {
    id: "SHIPPED",
    label: "Shipped",
    title: "Shipped",
    description: "Your package is on the way to you.",
  },
  {
    id: "DELIVERED",
    label: "Delivered",
    title: "Delivered",
    description: "Your package was delivered.",
  },
] as const;

export type TrackingStepId = (typeof TRACKING_STEPS)[number]["id"];

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canCancelOrder(status: string) {
  return ["PENDING", "CONFIRMED", "PROCESSING"].includes(status);
}

export function trackingStepIndex(status: string): number {
  if (status === "CANCELLED") return -1;
  if (status === "DELIVERED") return 4;
  if (status === "SHIPPED") return 3;
  if (status === "PACKED") return 2;
  if (status === "CONFIRMED" || status === "PROCESSING") return 1;
  return 0;
}

export function friendlyOrderStatus(status: string): string {
  if (status === "CANCELLED") return "Cancelled";
  if (status === "DELIVERED") return "Delivered";
  if (status === "SHIPPED") return "Shipped";
  if (status === "PACKED") return "Packed";
  if (status === "PROCESSING") return "Preparing";
  if (status === "CONFIRMED") return "Preparing";
  if (status === "PENDING") return "Ordered";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function trackingHeadline(status: string): { title: string; subtitle: string } {
  switch (status) {
    case "CANCELLED":
      return { title: "Order cancelled", subtitle: "This order was cancelled and will not be shipped." };
    case "DELIVERED":
      return { title: "Delivered", subtitle: "Your package was delivered. Thank you for shopping with us." };
    case "SHIPPED":
      return { title: "Shipped", subtitle: "Your package is on the way. Track progress below." };
    case "PACKED":
      return { title: "Packed", subtitle: "Your order is packed and will ship soon." };
    case "PROCESSING":
      return { title: "Preparing your order", subtitle: "We are packing your items for shipment." };
    case "CONFIRMED":
      return { title: "Order confirmed", subtitle: "We confirmed your order and are preparing it now." };
    case "PENDING":
    default:
      return { title: "Order placed", subtitle: "We received your order and will update tracking as it moves." };
  }
}

export function expectedDeliveryWindow(createdAt: string) {
  const start = new Date(createdAt);
  const from = new Date(start);
  from.setDate(from.getDate() + 2);
  const to = new Date(start);
  to.setDate(to.getDate() + 4);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
  return `${fmt(from)} – ${fmt(to)}`;
}

export function paymentLabel(method?: string) {
  if (method === "ONLINE") return "Pay online";
  return "Cash on delivery";
}

export function friendlyHistoryLabel(toStatus: string): string {
  switch (toStatus) {
    case "PENDING":
      return "Order placed";
    case "CONFIRMED":
      return "Order confirmed";
    case "PROCESSING":
      return "Preparing for packing";
    case "PACKED":
      return "Packed";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Order cancelled";
    default:
      return friendlyOrderStatus(toStatus);
  }
}

/** Map raw status history onto customer milestones for date labels */
export function milestoneReachedAt(
  history: Array<{ toStatus: string; createdAt: string }>,
  createdAt: string,
): Partial<Record<TrackingStepId, string>> {
  const sorted = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const dates: Partial<Record<TrackingStepId, string>> = {
    ORDERED: createdAt,
  };
  for (const entry of sorted) {
    if (entry.toStatus === "PENDING") dates.ORDERED ??= entry.createdAt;
    if (entry.toStatus === "CONFIRMED" || entry.toStatus === "PROCESSING") {
      dates.PREPARING ??= entry.createdAt;
    }
    if (entry.toStatus === "PACKED") dates.PACKED = entry.createdAt;
    if (entry.toStatus === "SHIPPED") dates.SHIPPED = entry.createdAt;
    if (entry.toStatus === "DELIVERED") dates.DELIVERED = entry.createdAt;
  }
  return dates;
}
