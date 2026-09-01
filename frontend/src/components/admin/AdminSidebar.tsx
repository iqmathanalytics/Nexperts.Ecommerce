"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose } from "lucide-react";
import { useMemo, useState } from "react";
import { adminNav, adminNavSectionForPath, isAdminNavActive } from "@/lib/adminNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminSidebar({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const path = usePathname();
  const activeSection = adminNavSectionForPath(path);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const expanded = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const section of adminNav) {
      next[section.title] = openSections[section.title] ?? section.title === activeSection;
    }
    return next;
  }, [activeSection, openSections]);

  function toggleSection(title: string) {
    setOpenSections((prev) => ({ ...prev, [title]: !(prev[title] ?? title === activeSection) }));
  }

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex h-screen w-72 flex-col bg-slate-950 text-slate-200 transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 px-5 py-5">
        <div>
          <p className="font-serif text-xl text-white">Nexperts Admin</p>
          <p className="mt-1 text-xs text-slate-400">Store management</p>
        </div>
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <PanelLeftClose className="h-4 w-4" />
          Close
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/admin"
          className={`block rounded-md px-3 py-2 text-sm ${isAdminNavActive(path, "/admin") ? "bg-slate-800 text-white" : "hover:bg-slate-900"}`}
        >
          Dashboard
        </Link>
        <Link
          href="/admin/analytics"
          className={`mb-4 mt-1 block rounded-md px-3 py-2 text-sm ${
            isAdminNavActive(path, "/admin/analytics") ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          Analytics
        </Link>
        {adminNav.map((section) => {
          if (section.items.length === 1) {
            const item = section.items[0]!;
            return (
              <Link
                key={section.title}
                href={item.href}
                className={`mb-1 block rounded-md px-3 py-2 text-sm ${
                  isAdminNavActive(path, item.href) ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          }

          const isOpen = expanded[section.title];
          return (
            <div key={section.title} className="mb-3">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              >
                <span>{section.title}</span>
                <span className="text-xs text-slate-500">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen ? (
                <div className="mt-1 space-y-0.5 border-l border-slate-800 pl-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-md px-3 py-2 text-sm ${
                        isAdminNavActive(path, item.href) ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-900 hover:text-white" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </aside>
  );
}
