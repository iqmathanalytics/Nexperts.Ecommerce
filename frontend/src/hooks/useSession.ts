"use client";

import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { ApiRequestError, api } from "@/lib/api";
import type { User } from "@/lib/types";
import { SESSION_GATE_EVENT, hasSessionGate } from "@/lib/sessionGate";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SESSION_GATE_EVENT, onStoreChange);
  return () => window.removeEventListener(SESSION_GATE_EVENT, onStoreChange);
}

function readCustomerGate() {
  return hasSessionGate("customer");
}

function isUnreachable(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 0 || error.status === 502 || error.code === "NETWORK_ERROR");
}

export function useSession() {
  const gated = useSyncExternalStore(subscribe, readCustomerGate, () => false);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: User | null }>("/auth/me"),
    retry: (count, error) => count < 2 && isUnreachable(error),
    staleTime: 5 * 60_000,
    enabled: gated,
  });
  const user = me.data?.data.user ?? undefined;

  return {
    user,
    isLoading: gated && me.isPending,
    isAuthenticated: Boolean(user),
  };
}
