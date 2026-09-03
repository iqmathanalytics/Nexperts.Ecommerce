"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { ApiRequestError, api } from "@/lib/api";
import type { User } from "@/lib/types";
import { SESSION_GATES, SESSION_GATE_EVENT, clearSessionGate } from "@/lib/sessionGate";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SESSION_GATE_EVENT, onStoreChange);
  return () => window.removeEventListener(SESSION_GATE_EVENT, onStoreChange);
}

function readCustomerGate() {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${SESSION_GATES.customer}=`);
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

  useEffect(() => {
    if (gated && me.isSuccess && !user) clearSessionGate("customer");
  }, [gated, me.isSuccess, user]);

  return {
    user,
    isLoading: gated && me.isPending,
    isAuthenticated: Boolean(user),
  };
}
