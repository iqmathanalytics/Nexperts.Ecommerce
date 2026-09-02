"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Address = { id: number; fullName: string; phone: string; line1: string; city: string; state: string; postalCode: string; isDefault: boolean };

export default function AddressesPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["addresses"], queryFn: () => api<Address[]>("/addresses") });
  const form = useForm({ defaultValues: { fullName: "", phone: "", line1: "", city: "", state: "", postalCode: "", country: "Malaysia", isDefault: false } });
  const create = useMutation({
    mutationFn: (body: unknown) => api("/addresses", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); form.reset(); },
  });
  const del = useMutation({
    mutationFn: (id: number) => api(`/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
  const def = useMutation({
    mutationFn: (id: number) => api(`/addresses/${id}/default`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
  return (
    <div className="text-ink">
      <h1 className="text-3xl font-semibold text-ink">Addresses</h1>
      <div className="mt-4 space-y-3">
        {(list.data?.data ?? []).map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-white p-4">
            <p className="font-medium text-ink">{a.fullName} {a.isDefault ? "(Default)" : ""}</p>
            <p className="text-sm text-muted">{a.line1}, {a.city}, {a.state} {a.postalCode}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => def.mutate(a.id)}>Set default</Button>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      <form className="mt-6 grid max-w-lg gap-2" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
        <Input placeholder="Name" {...form.register("fullName")} />
        <Input placeholder="Phone" {...form.register("phone")} />
        <Input placeholder="Address" {...form.register("line1")} />
        <Input placeholder="City" {...form.register("city")} />
        <Input placeholder="State" {...form.register("state")} />
        <Input placeholder="PIN" {...form.register("postalCode")} />
        <Button type="submit">Add address</Button>
      </form>
    </div>
  );
}
