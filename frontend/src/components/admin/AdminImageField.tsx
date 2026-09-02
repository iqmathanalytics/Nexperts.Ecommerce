"use client";

import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";

export function AdminImageField({
  label,
  value,
  onChange,
  folder = "merch",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
      <input
        className="mt-2 text-sm"
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.append("image", file);
          fd.append("folder", folder);
          const res = await api<{ url: string }>("/admin/media", { method: "POST", body: fd });
          onChange(res.data.url);
          e.target.value = "";
        }}
      />
      {value ? <img src={mediaUrl(value)} alt="" className="mt-2 h-24 w-24 rounded object-cover" /> : null}
    </div>
  );
}
