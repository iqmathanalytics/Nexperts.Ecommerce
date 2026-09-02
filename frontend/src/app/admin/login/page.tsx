"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Lock, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { FieldError, Toast } from "@/components/ui/state";
import { SITE_NAME } from "@/lib/utils";
import type { User } from "@/lib/types";
import { AuthInput, PasswordField } from "@/components/store/AuthStage";
import { WOMEN_HERO } from "@/lib/editorial";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginBody = z.infer<typeof schema>;

export default function AdminLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginBody>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const session = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ user: User }>("/admin/auth/me"),
    retry: false,
  });

  const login = useMutation({
    mutationFn: (body: LoginBody) =>
      api<{ user: User; permissions: string[] }>("/admin/auth/login", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (res) => {
      qc.setQueryData(["admin-me"], { data: { user: res.data.user } });
      router.replace("/admin");
    },
    onError: (e: Error) => setError(e.message || "Unable to sign in. Please try again."),
  });

  useEffect(() => {
    if (session.isSuccess && session.data.data.user) router.replace("/admin");
  }, [router, session.data, session.isSuccess]);

  if (session.isPending || session.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen bg-background text-ink lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-brand lg:block">
        <Image src={WOMEN_HERO} alt="" fill priority quality={70} sizes="50vw" className="object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/55 to-brand/20" />
        <div className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full border border-white/15" aria-hidden />
        <div className="float-slow pointer-events-none absolute right-16 top-40 h-28 w-28 rounded-full border border-accent/40" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div>
            <p className="nexperts-mark text-[10px] text-white/70">{SITE_NAME} · Studio</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95]">
              House
              <br />
              console
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
              Manage clothing, orders, and inventory — the same language as the storefront.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-white/85">
            <Feature icon={Package} label="Catalog, brands, and stock" />
            <Feature icon={ShoppingBag} label="Orders and customer activity" />
            <Feature icon={BarChart3} label="Revenue and review insight" />
          </ul>
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Staff only · Customer accounts use store login</p>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-12 md:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="orb orb-a opacity-30" />
          <div className="orb orb-c opacity-25" />
        </div>
        <div className="relative w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="nexperts-mark text-[10px] text-muted">{SITE_NAME}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold">House console</h1>
          </div>

          <form
            className="rounded-[2rem] border border-line bg-surface p-8 shadow-[0_32px_70px_-40px_rgba(28,25,21,0.45)]"
            onSubmit={form.handleSubmit((values) => {
              setError(null);
              login.mutate(values);
            })}
            noValidate
          >
            <div className="mb-6 flex items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-accent">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
                <p className="mt-1 text-sm text-muted">Enter staff credentials to continue.</p>
                <p className="mt-2 text-xs text-muted">
                  Shoppers should use the{" "}
                  <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
                    store login
                  </Link>
                  .
                </p>
              </div>
            </div>

            {error ? (
              <div className="mb-4">
                <Toast tone="error" message={error} />
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <AuthInput
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@nexperts.com"
                  {...form.register("email")}
                />
                <FieldError message={form.formState.errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <PasswordField id="admin-password" registration={form.register("password")} placeholder="Enter your password" />
                <FieldError message={form.formState.errors.password?.message} />
              </div>
            </div>

            <Button type="submit" className="mt-6 h-12 w-full rounded-full" disabled={login.isPending}>
              <Lock className="h-4 w-4" />
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Looking for the store?{" "}
            <Link href="/" className="font-semibold text-ink underline-offset-4 hover:underline">
              Go to {SITE_NAME}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Package; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </li>
  );
}
