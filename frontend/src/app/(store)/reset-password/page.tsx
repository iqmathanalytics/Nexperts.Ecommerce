"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const tokenFromUrl = params.get("token") ?? "";
  const form = useForm({
    resolver: zodResolver(z.object({ token: z.string().min(20), password: z.string().min(8) })),
    defaultValues: { token: tokenFromUrl, password: "" },
  });
  const mutate = useMutation({
    mutationFn: (body: { token: string; password: string }) => api("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => router.push("/login"),
    onError: (e: Error) => setError(e.message),
  });
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Reset password</h1>
      {error && <div className="mt-4"><Toast tone="error" message={error} /></div>}
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((v) => mutate.mutate(v))}>
        {!tokenFromUrl && (
          <div><Label>Reset token</Label><Input {...form.register("token")} /></div>
        )}
        {tokenFromUrl && <input type="hidden" {...form.register("token")} />}
        <div><Label>New password</Label><Input type="password" {...form.register("password")} /></div>
        <Button type="submit" className="w-full">Reset</Button>
      </form>
    </div>
  );
}

export default function ResetPage() {
  return <Suspense><ResetInner /></Suspense>;
}
