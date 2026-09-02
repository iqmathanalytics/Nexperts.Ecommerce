"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Input, Label } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type PickProduct = { id: number; name: string; slug: string; status?: string };

export function AdminProductPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 250);
  const search = useQuery({
    queryKey: ["admin-products-pick", dq],
    queryFn: () => api<PickProduct[]>(`/admin/products?q=${encodeURIComponent(dq)}&status=PUBLISHED&limit=30`),
  });
  const selected = useQuery({
    queryKey: ["admin-products-selected", selectedIds.join(",")],
    queryFn: async () => {
      if (!selectedIds.length) return { data: [] as PickProduct[] };
      const rows = await Promise.all(
        selectedIds.map((id) => api<PickProduct>(`/admin/products/${id}`).then((r) => r.data).catch(() => null)),
      );
      return { data: rows.filter(Boolean) as PickProduct[] };
    },
    enabled: selectedIds.length > 0,
  });
  const results = search.data?.data ?? [];
  const selectedRows = useMemo(() => {
    const map = new Map((selected.data?.data ?? []).map((p) => [p.id, p]));
    for (const p of results) map.set(p.id, p);
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as PickProduct[];
  }, [results, selected.data?.data, selectedIds]);

  return (
    <div>
      <Label>Products on the storefront</Label>
      <Input placeholder="Search published products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-line bg-surface-raised">
        {results.map((p) => (
          <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-brand-soft/60">
            <input
              type="checkbox"
              checked={selectedIds.includes(p.id)}
              onChange={(e) => onChange(e.target.checked ? [...selectedIds, p.id] : selectedIds.filter((x) => x !== p.id))}
            />
            {p.name}
          </label>
        ))}
        {!results.length ? <p className="px-3 py-2 text-sm text-muted">No published products match.</p> : null}
      </div>
      {selectedRows.length ? (
        <p className="mt-2 text-xs text-muted">
          {selectedRows.length} selected: {selectedRows.map((p) => p.name).join(", ")}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">None selected — the seasonal page will fall back to new arrivals.</p>
      )}
    </div>
  );
}
