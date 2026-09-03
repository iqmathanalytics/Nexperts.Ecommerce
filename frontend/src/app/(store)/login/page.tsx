"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { FieldError, Toast } from "@/components/ui/state";
import { Suspense, useState } from "react";
import { safeNextPath } from "@/lib/auth";
import { setSessionGate } from "@/lib/sessionGate";
import { AuthInput, AuthStage, PasswordField } from "@/components/store/AuthStage";
import { WOMEN_HERO } from "@/lib/editorial";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(schema) });
  const login = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: async () => {
      setSessionGate("customer");
      const { readGuestCart, clearGuestCart } = await import("@/lib/guestCart");
      const guest = readGuestCart();
      if (guest.length) {
        try {
          await api("/cart/merge", {
            method: "POST",
            body: JSON.stringify({ items: guest.map((g) => ({ variantId: g.variantId, quantity: g.quantity })) }),
          });
          clearGuestCart();
        } catch {
          /* merge best-effort */
        }
      }
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      router.push(next);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <AuthStage
      image={WOMEN_HERO}
      kicker="Member"
      title="Welcome back"
      subtitle="Sign in to your house account — bag, wishlist, orders, and styling notes in one place."
    >
      {error ? (
        <div className="mb-5">
          <Toast tone="error" message={error} />
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
        <div>
          <Label>Email</Label>
          <AuthInput type="email" autoComplete="email" placeholder="you@email.com" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label>Password</Label>
          <PasswordField registration={form.register("password")} />
        </div>
        <Button type="submit" className="mt-2 h-12 w-full rounded-full" pending={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/forgot-password" className="font-semibold text-ink underline-offset-4 hover:underline">
          Forgot password?
        </Link>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted">
        Store staff should use{" "}
        <Link href="/admin/login" className="font-semibold text-ink underline-offset-2 hover:underline">
          Admin login
        </Link>
        . Complimentary shipping over RM 999.
      </p>
    </AuthStage>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
