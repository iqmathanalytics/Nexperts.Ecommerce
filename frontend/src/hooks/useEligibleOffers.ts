"use client";

import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/hooks/useSession";
import {
  filterOffersForCustomer,
  filterPromoTexts,
  readLocalFirstOrderOfferDone,
} from "@/lib/offers";
import type { OfferItem } from "@/lib/editorial";

function subscribeLocal(onStoreChange: () => void) {
  window.addEventListener("nx-first-order-offer", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("nx-first-order-offer", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

type Eligibility = {
  eligibleForFirstOrderOffer: boolean;
  hasCompletedOrder: boolean;
  hasClaimedWelcome: boolean;
};

export function useHideFirstOrderOffers() {
  const { isAuthenticated } = useSession();
  const localDone = useSyncExternalStore(subscribeLocal, readLocalFirstOrderOfferDone, () => false);
  const eligibility = useQuery({
    queryKey: ["coupon-eligibility"],
    queryFn: () => api<Eligibility>("/coupons/eligibility"),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const serverHide =
    isAuthenticated &&
    eligibility.isSuccess &&
    eligibility.data?.data.eligibleForFirstOrderOffer === false;

  return localDone || Boolean(serverHide);
}

export function useEligibleOffers(offers: OfferItem[]) {
  const hide = useHideFirstOrderOffers();
  return filterOffersForCustomer(offers, hide);
}

export function useEligiblePromoTexts(texts: string[]) {
  const hide = useHideFirstOrderOffers();
  return filterPromoTexts(texts, hide);
}
