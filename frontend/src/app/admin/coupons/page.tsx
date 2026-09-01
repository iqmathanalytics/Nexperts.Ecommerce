"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

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

export default function CouponsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["coupons"], queryFn: () => api<Coupon[]>("/admin/coupons") });
  const form = useForm({
    defaultValues: {
      code: "",
      type: "PERCENTAGE",
      value: 10,
      minOrderAmount: 999,
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 16),
    },
  });
  const create = useMutation({
    mutationFn: (v: Record<string, unknown>) =>
      api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({ ...v, value: Number(v.value), minOrderAmount: Number(v.minOrderAmount) }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      form.reset();
    },
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

  return (
    <AdminPage title="Coupons">
      <form
        className="grid shrink-0 gap-2 rounded-xl bg-white p-4 md:grid-cols-3"
        onSubmit={form.handleSubmit((v) => create.mutate(v))}
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
        <Button type="submit" disabled={create.isPending}>
          Create
        </Button>
        <div className="md:col-span-3">
          <FormError error={create.error} />
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
