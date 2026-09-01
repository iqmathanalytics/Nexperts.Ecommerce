"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";
import { useState } from "react";

export default function ForgotPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(z.object({ email: z.string().email() })) });
  const mutate = useMutation({
    mutationFn: (body: { email: string }) => api<{ ok: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => setMsg("If the email exists, a reset link was sent."),
  });
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Forgot password</h1>
      {msg && <div className="mt-4"><Toast message={msg} /></div>}
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((v) => mutate.mutate(v))}>
        <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
    </div>
  );
}
