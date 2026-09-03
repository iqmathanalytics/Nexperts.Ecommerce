import type { OfferItem } from "@/lib/editorial";

export const FIRST_ORDER_COUPON_CODES = new Set(["WELCOME10"]);
export const FIRST_ORDER_OFFER_DONE_KEY = "nx-first-order-offer-done";

export function isFirstOrderCouponCode(code: string) {
  return FIRST_ORDER_COUPON_CODES.has(code.trim().toUpperCase());
}

export function isFirstOrderOffer(offer: Pick<OfferItem, "code" | "kicker" | "text">) {
  if (isFirstOrderCouponCode(offer.code)) return true;
  const hay = `${offer.kicker} ${offer.text}`.toLowerCase();
  return /first\s*order|welcome\s*10|welcome10/.test(hay);
}

export function isFirstOrderPromoText(text: string) {
  return /welcome\s*10|welcome10|first\s*order/i.test(text);
}

export function markFirstOrderOfferDone() {
  try {
    localStorage.setItem(FIRST_ORDER_OFFER_DONE_KEY, "1");
    window.dispatchEvent(new Event("nx-first-order-offer"));
  } catch {
    /* ignore */
  }
}

export function readLocalFirstOrderOfferDone() {
  try {
    return localStorage.getItem(FIRST_ORDER_OFFER_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function filterOffersForCustomer<T extends OfferItem>(offers: T[], hideFirstOrder: boolean): T[] {
  if (!hideFirstOrder) return offers;
  return offers.filter((o) => !isFirstOrderOffer(o));
}

export function filterPromoTexts(texts: string[], hideFirstOrder: boolean) {
  if (!hideFirstOrder) return texts;
  return texts.filter((t) => !isFirstOrderPromoText(t));
}
