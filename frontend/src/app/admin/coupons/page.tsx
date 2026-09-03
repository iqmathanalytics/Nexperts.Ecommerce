"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { useToast } from "@/components/ui/toast";

type Coupon = {
  id: number;
  code: string;
  type: string;
  value: string | number;
  minOrderAmount: string | number;
  status: string;
  usageCount: number;
  usageLimit: number | null;
  startsAt: string;
  endsAt: string;
};

type CouponForm = {
  code: string;
  type: string;
  value: number;
  minOrderAmount: number;
  startsAt: string;
  endsAt: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyForm = (): CouponForm => ({
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minOrderAmount: 999,
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 16),
  status: "ACTIVE",
});

function toLocalInput(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return iso.slice(0, 16);
  }
}

export default function CouponsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["coupons"], queryFn: () => api<Coupon[]>("/admin/coupons") });
  const form = useForm<CouponForm>({ defaultValues: emptyForm() });

  const create = useMutation({
    mutationFn: (v: CouponForm) =>
      api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          ...v,
          code: v.code.trim().toUpperCase(),
          value: Number(v.value),
          minOrderAmount: Number(v.minOrderAmount),
          startsAt: new Date(v.startsAt).toISOString(),
          endsAt: new Date(v.endsAt).toISOString(),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      form.reset(emptyForm());
      setEditingId(null);
      toast.push("Coupon created", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const update = useMutation({
    mutationFn: (v: CouponForm) =>
      api(`/admin/coupons/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...v,
          code: v.code.trim().toUpperCase(),
          value: Number(v.value),
          minOrderAmount: Number(v.minOrderAmount),
          startsAt: new Date(v.startsAt).toISOString(),
          endsAt: new Date(v.endsAt).toISOString(),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      form.reset(emptyForm());
      setEditingId(null);
      toast.push("Coupon saved", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const toggleStatus = useMutation({
    mutationFn: (c: Coupon) =>
      api(`/admin/coupons/${c.id}`, {
        method: "PUT",
        body: JSON.stringify({
          code: c.code,
          type: c.type,
          value: Number(c.value),
          minOrderAmount: Number(c.minOrderAmount),
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          status: c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.push("Coupon status updated", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const query = q.trim().toLowerCase();
    return all.filter((c) => {
      if (query && !c.code.toLowerCase().includes(query)) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }, [data?.data, q, status]);

  function startEdit(c: Coupon) {
    setEditingId(c.id);
    form.reset({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      minOrderAmount: Number(c.minOrderAmount),
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      status: (c.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    });
  }

  const saving = create.isPending || update.isPending;
  const formError = create.error || update.error || toggleStatus.error;

  return (
    <AdminPage title="Coupons" description="Discount codes for checkout — percentage, fixed, and free shipping.">
      <form
        className="grid shrink-0 gap-2 rounded-2xl border border-line bg-surface-raised p-4 md:grid-cols-3"
        onSubmit={form.handleSubmit((v) => (editingId ? update.mutate(v) : create.mutate(v)))}
      >
        <Input placeholder="CODE" {...form.register("code", { required: true })} />
        <Select {...form.register("type")}>
          <option>PERCENTAGE</option>
          <option>FIXED</option>
        </Select>
        <Input type="number" placeholder="Value" {...form.register("value")} />
        <Input type="number" placeholder="Min order" {...form.register("minOrderAmount")} />
        <Input type="datetime-local" {...form.register("startsAt")} />
        <Input type="datetime-local" {...form.register("endsAt")} />
        <Select {...form.register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {editingId ? (update.isPending ? "Saving…" : "Save") : create.isPending ? "Creating…" : "Create"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                form.reset(emptyForm());
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
        <div className="md:col-span-3">
          <FormError error={formError} />
        </div>
      </form>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search code" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "code", header: "Code", cell: (c) => c.code },
          { id: "type", header: "Type", cell: (c) => c.type },
          { id: "value", header: "Value", cell: (c) => c.value },
          { id: "min", header: "Min order", cell: (c) => c.minOrderAmount },
          { id: "usage", header: "Usage", cell: (c) => `${c.usageCount}/${c.usageLimit ?? "∞"}` },
          { id: "status", header: "Status", cell: (c) => c.status },
          { id: "dates", header: "Valid", cell: (c) => `${formatDate(c.startsAt)} – ${formatDate(c.endsAt)}` },
          {
            id: "actions",
            header: "Actions",
            cell: (c) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" disabled={toggleStatus.isPending} onClick={() => toggleStatus.mutate(c)}>
                  {c.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        loading={isLoading}
        empty="No coupons match these filters."
        footer={`${rows.length} coupon${rows.length === 1 ? "" : "s"}`}
      />
    </AdminPage>
  );
}
