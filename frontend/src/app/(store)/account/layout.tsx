"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageState, Spinner } from "@/components/ui/state";
import type { ReactNode } from "react";
import { loginUrl } from "@/lib/auth";

const links = [
  ["/account", "Overview"],
  ["/account/profile", "Profile"],
  ["/account/addresses", "Addresses"],
  ["/account/orders", "Orders"],
  ["/account/wishlist", "Wishlist"],
  ["/account/reviews", "Reviews"],
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<{ user: User }>("/auth/me"), retry: false });
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => { qc.clear(); router.push("/"); },
  });
  if (me.isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (me.isError) return <PageState title="Please sign in"><Link href={loginUrl(path)}>Login</Link></PageState>;
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 text-ink md:grid-cols-[200px_1fr]">
      <aside className="h-fit space-y-1 rounded-xl border border-line bg-white p-3">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              path === href ? "bg-brand-soft text-ink" : "text-muted hover:bg-background hover:text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
        <Button variant="ghost" className="w-full justify-start text-ink" onClick={() => logout.mutate()}>Logout</Button>
      </aside>
      <div className="text-ink">{children}</div>
    </div>
  );
}
