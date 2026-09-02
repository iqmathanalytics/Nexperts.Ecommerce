"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Spinner } from "@/components/ui/state";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { adminPageMeta } from "@/lib/adminNav";
import { SITE_NAME } from "@/lib/utils";

const SIDEBAR_KEY = "admin-sidebar-open";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const isLogin = path === "/admin/login";
  const page = adminPageMeta(path);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
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
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (!desktop) {
        setSidebarOpen(false);
      } else {
        try {
          setSidebarOpen(localStorage.getItem(SIDEBAR_KEY) !== "false");
        } catch {
          setSidebarOpen(true);
        }
      }
      setSidebarReady(true);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!sidebarReady || !isDesktop) return;
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
    } catch {
      /* ignore */
    }
  }, [sidebarOpen, sidebarReady, isDesktop]);

  if (isLogin) return <>{children}</>;
  if (!me.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  const user = me.data.data.user;
  const overlay = !isDesktop;
  const pushContent = isDesktop && sidebarOpen;

  return (
    <div
      className="h-screen overflow-hidden bg-background text-ink"
      style={{ ["--admin-sidebar-width" as string]: pushContent ? "18rem" : "0px" }}
    >
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => logout.mutate()}
        user={user}
        overlay={overlay}
      />
      {overlay && sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-ink/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className="flex h-screen flex-col transition-[margin] duration-200"
        style={{ marginLeft: "var(--admin-sidebar-width)" }}
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md lg:px-6">
          <button
            type="button"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-raised text-ink transition hover:border-ink"
          >
            {sidebarOpen && isDesktop ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{page.section}</p>
            <p className="truncate text-sm text-ink lg:hidden">{page.title}</p>
          </div>
          <p className="ml-auto hidden truncate text-sm text-muted sm:block">
            {SITE_NAME} · {user.firstName || user.email}
          </p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto h-full min-h-0 max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
