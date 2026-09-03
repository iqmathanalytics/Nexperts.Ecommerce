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
import { MEN_HERO } from "@/lib/editorial";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(schema) });
  const mutate = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      setSessionGate("customer");
      qc.invalidateQueries({ queryKey: ["me"] });
      router.push(next);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <AuthStage
      image={MEN_HERO}
      kicker="Join the house"
      title="Create your account"
      subtitle="A Nexperts membership for fittings, seasonal drops, and tracked orders."
    >
      {error ? (
        <div className="mb-5">
          <Toast tone="error" message={error} />
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutate.mutate(v))}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First name</Label>
            <AuthInput placeholder="Aina" {...form.register("firstName")} />
            <FieldError message={form.formState.errors.firstName?.message} />
          </div>
          <div>
            <Label>Last name</Label>
            <AuthInput placeholder="Rahman" {...form.register("lastName")} />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <AuthInput type="email" autoComplete="email" placeholder="you@email.com" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label>Phone</Label>
          <AuthInput type="tel" placeholder="01x-xxx xxxx" {...form.register("phone")} />
        </div>
        <div>
          <Label>Password</Label>
          <PasswordField registration={form.register("password")} autoComplete="new-password" placeholder="At least 8 characters" />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button type="submit" className="mt-2 h-12 w-full rounded-full" pending={mutate.isPending}>
          {mutate.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already a member?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthStage>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
