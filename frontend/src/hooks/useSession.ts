"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export function useSession() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: User }>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
  return {
    user: me.data?.data.user,
    isLoading: me.isPending,
    isAuthenticated: me.isSuccess,
  };
}
