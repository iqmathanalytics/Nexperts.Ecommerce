"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";
import { useState } from "react";
import { AuthInput, PasswordField } from "@/components/store/AuthStage";

export default function ProfilePage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<{ user: User }>("/auth/me") });
  const user = me.data?.data.user;
  const form = useForm({ values: user });
  const save = useMutation({
    mutationFn: (body: Partial<User>) => api("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setMsg("Profile updated");
    },
  });
  const pw = useForm<{ currentPassword: string; newPassword: string }>();
  const changePw = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api("/auth/me/password", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      setMsg("Password changed");
      pw.reset();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "NX";

  return (
    <div className="space-y-6 text-ink">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Account</p>
        <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Your details</h2>
        <p className="mt-2 text-sm text-muted">Keep your house profile current for deliveries.</p>
      </div>
      {msg ? <Toast message={msg} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <form
          className="rounded-[2rem] border border-line bg-surface p-6 md:p-8"
          onSubmit={form.handleSubmit((v) => save.mutate({ firstName: v.firstName, lastName: v.lastName, phone: v.phone }))}
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand font-display text-xl font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="font-display text-xl font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>First name</Label>
                <AuthInput {...form.register("firstName")} />
              </div>
              <div>
                <Label>Last name</Label>
                <AuthInput {...form.register("lastName")} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <AuthInput value={user?.email ?? ""} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <AuthInput placeholder="01x-xxx xxxx" {...form.register("phone")} />
            </div>
            <Button type="submit" className="mt-2 h-12 rounded-full" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save details"}
            </Button>
          </div>
        </form>

        <form
          className="rounded-[2rem] border border-line bg-surface p-6 md:p-8"
          onSubmit={pw.handleSubmit((v) => changePw.mutate(v))}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Security</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">Change password</h3>
          <p className="mt-2 text-sm text-muted">Use a unique password for your Nexperts house account.</p>
          <div className="mt-6 grid gap-4">
            <div>
              <Label>Current password</Label>
              <PasswordField registration={pw.register("currentPassword")} />
            </div>
            <div>
              <Label>New password</Label>
              <PasswordField registration={pw.register("newPassword")} autoComplete="new-password" placeholder="New password" />
            </div>
            <Button type="submit" variant="outline" className="mt-2 h-12 rounded-full" disabled={changePw.isPending}>
              {changePw.isPending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
