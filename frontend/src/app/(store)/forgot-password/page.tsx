"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";
import { useState } from "react";
import { AuthInput, AuthStage } from "@/components/store/AuthStage";
import { WOMEN_HERO } from "@/lib/editorial";

export default function ForgotPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(z.object({ email: z.string().email() })) });
  const mutate = useMutation({
    mutationFn: (body: { email: string }) => api<{ ok: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => setMsg("If the email exists, a reset link was sent."),
  });

  return (
    <AuthStage
      image={WOMEN_HERO}
      kicker="Account recovery"
      title="Forgot password"
      subtitle="Enter the email on your house account and we will send a reset link if it exists."
    >
      {msg ? (
        <div className="mb-5">
          <Toast message={msg} />
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutate.mutate(v))}>
        <div>
          <Label>Email</Label>
          <AuthInput type="email" placeholder="you@email.com" {...form.register("email")} />
        </div>
        <Button type="submit" className="h-12 w-full rounded-full" disabled={mutate.isPending}>
          {mutate.isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthStage>
  );
}
