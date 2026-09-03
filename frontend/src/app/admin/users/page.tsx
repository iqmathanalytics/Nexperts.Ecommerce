"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { useToast } from "@/components/ui/toast";

type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED";
};

const emptyForm = (): UserForm => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "ADMIN",
  status: "ACTIVE",
});

export default function UsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => api<AdminUser[]>("/admin/users") });
  const form = useForm<UserForm>({ defaultValues: emptyForm() });

  const create = useMutation({
    mutationFn: (v: UserForm) =>
      api("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          password: v.password,
          role: v.role,
          status: v.status,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      form.reset(emptyForm());
      setEditingId(null);
      toast.push("User created", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const update = useMutation({
    mutationFn: (v: UserForm) =>
      api(`/admin/users/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          role: v.role,
          status: v.status,
          ...(v.password.trim() ? { password: v.password } : {}),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      form.reset(emptyForm());
      setEditingId(null);
      toast.push("User saved", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const toggleStatus = useMutation({
    mutationFn: (u: AdminUser) =>
      api(`/admin/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: u.firstName,
          lastName: u.lastName || " ",
          email: u.email,
          role: u.role,
          status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.push("User status updated", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
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

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    form.reset({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: "",
      role: u.role,
      status: (u.status as "ACTIVE" | "SUSPENDED") || "ACTIVE",
    });
  }

  const saving = create.isPending || update.isPending;

  return (
    <AdminPage title="Users" description="Staff accounts with roles for catalog, orders, and inventory.">
      <form
        className="grid shrink-0 gap-2 rounded-2xl border border-line bg-surface-raised p-4 md:grid-cols-3"
        onSubmit={form.handleSubmit((v) => (editingId ? update.mutate(v) : create.mutate(v)))}
      >
        <Input placeholder="First name" {...form.register("firstName", { required: true })} />
        <Input placeholder="Last name" {...form.register("lastName", { required: true })} />
        <Input placeholder="Email" type="email" {...form.register("email", { required: true })} />
        <Input
          type="password"
          placeholder={editingId ? "New password (optional)" : "Password"}
          {...form.register("password", { required: !editingId, minLength: editingId ? undefined : 8 })}
        />
        <Select {...form.register("role")}>
          <option>SUPER_ADMIN</option>
          <option>ADMIN</option>
          <option>INVENTORY_MANAGER</option>
          <option>ORDER_MANAGER</option>
          <option>ANALYST</option>
        </Select>
        <Select {...form.register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <div className="flex gap-2 md:col-span-3">
          <Button type="submit" pending={saving}>
            {editingId ? (update.isPending ? "Saving…" : "Save user") : create.isPending ? "Creating…" : "Create user"}
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
          <FormError error={create.error || update.error || toggleStatus.error} />
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
          {
            id: "actions",
            header: "Actions",
            cell: (u) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" pending={toggleStatus.isPending} onClick={() => toggleStatus.mutate(u)}>
                  {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                </Button>
              </div>
            ),
          },
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
