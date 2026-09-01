"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => api<AdminUser[]>("/admin/users") });
  const form = useForm({ defaultValues: { firstName: "", lastName: "", email: "", password: "", role: "ADMIN" } });
  const create = useMutation({
    mutationFn: (v: Record<string, string>) => api("/admin/users", { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      form.reset();
    },
  });
  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const query = q.trim().toLowerCase();
    return all.filter((u) => {
      const hay = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      if (query && !hay.includes(query)) return false;
      if (role && u.role !== role) return false;
      if (status && u.status !== status) return false;
      return true;
    });
  }, [data?.data, q, role, status]);

  return (
    <AdminPage title="Admin users">
      <form
        className="grid shrink-0 gap-2 rounded-xl bg-white p-4 md:grid-cols-3"
        onSubmit={form.handleSubmit((v) => create.mutate(v))}
      >
        <Input placeholder="First name" {...form.register("firstName", { required: true })} />
        <Input placeholder="Last name" {...form.register("lastName", { required: true })} />
        <Input placeholder="Email" type="email" {...form.register("email", { required: true })} />
        <Input type="password" placeholder="Password" {...form.register("password", { required: true, minLength: 8 })} />
        <Select {...form.register("role")}>
          <option>SUPER_ADMIN</option>
          <option>ADMIN</option>
          <option>INVENTORY_MANAGER</option>
          <option>ORDER_MANAGER</option>
          <option>ANALYST</option>
        </Select>
        <Button type="submit" disabled={create.isPending}>
          Create user
        </Button>
        <div className="md:col-span-3">
          <FormError error={create.error} />
        </div>
      </form>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-52">
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
          <option value="ORDER_MANAGER">ORDER_MANAGER</option>
          <option value="ANALYST">ANALYST</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (u) => `${u.firstName} ${u.lastName}` },
          { id: "email", header: "Email", cell: (u) => u.email },
          { id: "role", header: "Role", cell: (u) => u.role },
          { id: "status", header: "Status", cell: (u) => u.status },
        ]}
        rows={rows}
        rowKey={(u) => u.id}
        loading={isLoading}
        empty="No admin users match these filters."
        footer={`${rows.length} user${rows.length === 1 ? "" : "s"}`}
      />
    </AdminPage>
  );
}
