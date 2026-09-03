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
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/auth";
import { establishCustomerSession } from "@/lib/authSession";
import { AuthInput, AuthStage, PasswordField } from "@/components/store/AuthStage";
import { MEN_HERO } from "@/lib/editorial";
import type { User } from "@/lib/types";

const schema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || v.length >= 8, { message: "Phone must be at least 8 characters" }),
  password: z.string().min(8, "Use at least 8 characters"),
});

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "" } });

  const mutate = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => {
      const phone = body.phone?.trim();
      return api<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: body.firstName.trim(),
          lastName: body.lastName.trim(),
          email: body.email.trim(),
          password: body.password,
          ...(phone ? { phone } : {}),
        }),
      });
    },
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
        setError(e instanceof Error ? e.message : "Account created, but sign-in failed. Try logging in.");
      }
    },
    onError: (e: Error) => {
      setRedirecting(false);
      setError(e.message);
    },
  });

  if (redirecting) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
      </div>
    );
  }

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

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => {
          setError(null);
          mutate.mutate(v);
        })}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First name</Label>
            <AuthInput placeholder="Aina" {...form.register("firstName")} />
            <FieldError message={form.formState.errors.firstName?.message} />
          </div>
          <div>
            <Label>Last name</Label>
            <AuthInput placeholder="Rahman" {...form.register("lastName")} />
            <FieldError message={form.formState.errors.lastName?.message} />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <AuthInput type="email" autoComplete="email" placeholder="you@email.com" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label>Phone <span className="font-normal text-muted">(optional)</span></Label>
          <AuthInput type="tel" placeholder="01x-xxx xxxx" {...form.register("phone")} />
          <FieldError message={form.formState.errors.phone?.message} />
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
    <Suspense
      fallback={
        <div className="flex min-h-[50svh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
