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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); router.push(next); },
    onError: (e: Error) => setError(e.message),
  });
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Create account</h1>
      {error && <div className="mt-4"><Toast tone="error" message={error} /></div>}
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((v) => mutate.mutate(v))}>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>First name</Label><Input {...form.register("firstName")} /><FieldError message={form.formState.errors.firstName?.message} /></div>
          <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
        </div>
        <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
        <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
        <div><Label>Password</Label><Input type="password" {...form.register("password")} /><FieldError message={form.formState.errors.password?.message} /></div>
        <Button type="submit" className="w-full" disabled={mutate.isPending}>Register</Button>
      </form>
      <p className="mt-4 text-sm text-muted">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline-offset-2 hover:underline">Sign in</Link></p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
