"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelLeftOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Spinner } from "@/components/ui/state";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const SIDEBAR_KEY = "admin-sidebar-open";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const isLogin = path === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarReady, setSidebarReady] = useState(false);
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ user: User }>("/admin/auth/me"),
    retry: false,
    enabled: !isLogin,
  });
  const logout = useMutation({
    mutationFn: () => api("/admin/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["admin-me"] });
      qc.clear();
      router.replace("/admin/login");
    },
  });

  useEffect(() => {
    if (!isLogin && me.isError) router.replace("/admin/login");
  }, [isLogin, me.isError, router]);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "false") setSidebarOpen(false);
    } catch {
      /* ignore */
    }
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
    } catch {
      /* ignore */
    }
  }, [sidebarOpen, sidebarReady]);

  if (isLogin) return <>{children}</>;
  if (!me.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden bg-slate-100 text-stone-900"
      style={{ ["--admin-sidebar-width" as string]: sidebarOpen ? "18rem" : "0px" }}
    >
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={() => logout.mutate()} />
      {!sidebarOpen ? (
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-4 z-40 inline-flex items-center gap-2 rounded-r-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
        >
          <PanelLeftOpen className="h-4 w-4" />
          Open
        </button>
      ) : null}
      <main
        className={`h-screen overflow-hidden py-6 pr-6 text-stone-900 transition-[margin,padding] duration-200 ${sidebarOpen ? "pl-6" : "pl-20"}`}
        style={{ marginLeft: "var(--admin-sidebar-width)" }}
      >
        <div className="h-full min-h-0 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
