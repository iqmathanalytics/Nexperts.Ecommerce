"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Eye, EyeOff, Lock, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FieldError, Toast } from "@/components/ui/state";
import { SITE_NAME } from "@/lib/utils";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginBody = z.infer<typeof schema>;

export default function AdminLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-amber-300" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 px-12 py-12 text-slate-200 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(240,184,0,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.22),transparent_40%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">{SITE_NAME}</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white">Admin portal</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            Sign in to manage clothing, orders, inventory, and store performance from one workspace.
          </p>
        </div>
        <ul className="relative space-y-4 text-sm">
          <Feature icon={Package} label="Clothing categories, brands, and inventory in one place" />
          <Feature icon={ShoppingBag} label="Track orders and customer activity" />
          <Feature icon={BarChart3} label="Revenue, stock, and review insights" />
        </ul>
        <p className="relative text-xs text-slate-500">Staff access only. Customer accounts cannot sign in here.</p>
      </aside>

      <main className="flex items-center justify-center bg-slate-100 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{SITE_NAME}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Admin portal</h1>
          </div>
          <form
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            onSubmit={form.handleSubmit((values) => {
              setError(null);
              login.mutate(values);
            })}
            noValidate
          >
            <div className="mb-6 flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-amber-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-500">Enter your staff credentials to continue.</p>
                <p className="mt-2 text-xs text-slate-500">
                  Shoppers should use the{" "}
                  <Link href="/login" className="font-semibold text-slate-800 underline-offset-2 hover:underline">
                    store login
                  </Link>
                  .
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4">
                <Toast tone="error" message={error} />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  className="border-slate-300 bg-white text-slate-900"
                  type="email"
                  autoComplete="username"
                  placeholder="you@nexperts.com"
                  {...form.register("email")}
                />
                <FieldError message={form.formState.errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    className="border-slate-300 bg-white pr-11 text-slate-900"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800"
                    onClick={() => setShowPassword((open) => !open)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={form.formState.errors.password?.message} />
              </div>
            </div>

            <Button type="submit" className="mt-6 w-full bg-slate-950 text-white hover:bg-slate-800" disabled={login.isPending}>
              <Lock className="h-4 w-4" />
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Looking for the store?{" "}
            <Link href="/" className="font-semibold text-slate-900 hover:underline">
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
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-amber-300">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </li>
  );
}
