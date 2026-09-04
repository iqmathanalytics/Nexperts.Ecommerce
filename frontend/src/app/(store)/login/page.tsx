"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { FieldError, Toast } from "@/components/ui/state";
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/auth";
import { establishCustomerSession } from "@/lib/authSession";
import { clearSessionGate } from "@/lib/sessionGate";
import { AuthInput, AuthStage, PasswordField } from "@/components/store/AuthStage";
import { WOMEN_HERO } from "@/lib/editorial";
import type { User } from "@/lib/types";
import { useSession } from "@/hooks/useSession";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const qc = useQueryClient();
  const { isAuthenticated, isLoading: sessionLoading } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  // Soft gate may be set from a prior visit — confirm JWT before skipping the form.
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: User | null }>("/auth/me"),
    enabled: isAuthenticated || sessionLoading,
    retry: false,
  });

  useEffect(() => {
    if (me.isSuccess && !me.data?.data.user && sessionLoading === false && isAuthenticated === false) {
      // Stale soft gate with no JWT — drop it so the form is usable.
      clearSessionGate("customer");
    }
  }, [me.isSuccess, me.data?.data.user, sessionLoading, isAuthenticated]);

  useEffect(() => {
    if (me.data?.data.user) {
      setRedirecting(true);
      router.replace(next || DEFAULT_AFTER_LOGIN);
    }
  }, [me.data?.data.user, next, router]);

  const login = useMutation({
    mutationFn: (body: z.infer<typeof schema>) =>
      api<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: body.email.trim(), password: body.password }),
      }),
    onSuccess: async (res) => {
      setError(null);
      setRedirecting(true);
      try {
        const user = await establishCustomerSession(res.data.user);
        qc.setQueryData(["me"], { data: { user } });
        await qc.invalidateQueries({ queryKey: ["cart"] });
        router.replace(next || DEFAULT_AFTER_LOGIN);
      } catch (e) {
        setRedirecting(false);
        setError(e instanceof Error ? e.message : "Unable to complete sign-in. Please try again.");
      }
    },
    onError: (e: Error) => {
      setRedirecting(false);
      setError(e.message);
    },
  });

  if (sessionLoading || me.isLoading || me.data?.data.user || redirecting) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
      </div>
    );
  }

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

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => {
          setError(null);
          login.mutate(v);
        })}
        noValidate
      >
        <div>
          <Label>Email</Label>
          <AuthInput type="email" autoComplete="email" placeholder="you@email.com" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label>Password</Label>
          <PasswordField registration={form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button type="submit" className="mt-2 h-12 w-full rounded-full" pending={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
    <Suspense
      fallback={
        <div className="flex min-h-[50svh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
