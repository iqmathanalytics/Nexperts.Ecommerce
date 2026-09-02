"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export function useSession() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: User | null }>("/auth/me"),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const user = me.data?.data.user ?? undefined;
  return {
    user,
    isLoading: me.isPending,
    isAuthenticated: Boolean(user),
  };
}
