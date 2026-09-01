"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FieldError, Toast } from "@/components/ui/state";
import { Suspense, useState } from "react";
import { safeNextPath } from "@/lib/auth";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      router.push(next);
    },
    onError: (e: Error) => setError(e.message),
  });
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Required to add items to your bag, save a wishlist, or place an order.
      </p>
      <p className="mt-2 text-xs text-muted">
        Staff managing the store should use{" "}
        <Link href="/admin/login" className="font-semibold text-ink underline-offset-2 hover:underline">
          Admin login
        </Link>
        .
      </p>
      {error && <div className="mt-4"><Toast tone="error" message={error} /></div>}
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
        <div><Label>Email</Label><Input type="email" {...form.register("email")} /><FieldError message={form.formState.errors.email?.message} /></div>
        <div><Label>Password</Label><Input type="password" {...form.register("password")} /></div>
        <Button type="submit" className="w-full" disabled={login.isPending}>Sign in</Button>
      </form>
      <p className="mt-4 text-sm"><Link href="/forgot-password" className="text-ink font-semibold">Forgot password?</Link></p>
      <p className="mt-2 text-sm">New here? <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-ink font-semibold">Create an account</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
