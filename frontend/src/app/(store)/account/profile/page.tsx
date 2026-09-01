"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";
import { useState } from "react";

export default function ProfilePage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<{ user: User }>("/auth/me") });
  const form = useForm({ values: me.data?.data.user });
  const save = useMutation({
    mutationFn: (body: Partial<User>) => api("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); setMsg("Profile updated"); },
  });
  const pw = useForm<{ currentPassword: string; newPassword: string }>();
  const changePw = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) => api("/auth/me/password", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => setMsg("Password changed"),
    onError: (e: Error) => setMsg(e.message),
  });
  return (
    <div className="space-y-8 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Profile</h1>
      {msg && <Toast message={msg} />}
      <form className="grid max-w-lg gap-3" onSubmit={form.handleSubmit((v) => save.mutate({ firstName: v.firstName, lastName: v.lastName, phone: v.phone }))}>
        <div><Label>First name</Label><Input {...form.register("firstName")} /></div>
        <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
        <div><Label>Email</Label><Input value={me.data?.data.user.email ?? ""} disabled /></div>
        <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
        <Button type="submit">Save</Button>
      </form>
      <form className="grid max-w-lg gap-3" onSubmit={pw.handleSubmit((v) => changePw.mutate(v))}>
        <h2 className="font-semibold text-ink">Change password</h2>
        <Input type="password" placeholder="Current password" {...pw.register("currentPassword")} />
        <Input type="password" placeholder="New password" {...pw.register("newPassword")} />
        <Button type="submit" variant="outline">Update password</Button>
      </form>
    </div>
  );
}
