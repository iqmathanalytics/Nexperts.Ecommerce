"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn, mediaUrl } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const ACCEPT_HINT = "JPEG, PNG, WEBP or GIF · up to 5MB";

export async function uploadAdminImage(file: File, folder: string) {
  const fd = new FormData();
  fd.append("folder", folder);
  fd.append("image", file);
  const res = await api<{ url: string }>("/admin/media", { method: "POST", body: fd });
  return res.data.url;
}

function pickFiles(list: FileList | File[] | null | undefined) {
  return Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));
}

function DropZone({
  label,
  multiple,
  busy,
  onFiles,
  compact,
}: {
  label: string;
  multiple?: boolean;
  busy?: boolean;
  onFiles: (files: File[]) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = pickFiles(e.dataTransfer.files);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!busy) inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={take}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition",
        compact ? "min-h-28 py-4" : "min-h-36 py-6",
        over ? "border-ink bg-brand-soft" : "border-line bg-surface hover:border-ink hover:bg-surface-muted",
        busy && "pointer-events-none opacity-70",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const files = pickFiles(e.target.files);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      {busy ? (
        <LoaderCircle className="h-6 w-6 animate-spin text-brand" />
      ) : (
        <ImagePlus className="h-6 w-6 text-brand" />
      )}
      <span className="mt-2 text-sm font-semibold text-ink">{busy ? "Uploading…" : label}</span>
      <span className="mt-1 text-[11px] text-muted">{ACCEPT_HINT}</span>
      <span className="mt-1 text-[11px] text-muted">Drop a file or click to browse</span>
    </div>
  );
}

export function AdminImageField({
  label,
  value,
  onChange,
  folder = "merch",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
}) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const toast = useToast();

  async function upload(files: File[]) {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadAdminImage(file, folder));
      toast.push(`${label} updated`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {value ? (
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <img src={mediaUrl(value)} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium text-ink">{busy ? "Uploading…" : "Image added"}</p>
            <p className="truncate text-[11px] text-muted">{value}</p>
            <input
              ref={replaceRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const files = pickFiles(e.target.files);
                if (files.length) void upload(files);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="h-9 rounded-sm border border-line px-3 text-xs font-semibold hover:bg-surface-muted"
                onClick={() => replaceRef.current?.click()}
              >
                Replace
              </button>
              <button type="button" className="inline-flex h-9 items-center gap-1 px-2 text-xs font-semibold text-danger" onClick={() => onChange("")}>
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DropZone label="Add image" busy={busy} onFiles={upload} />
      )}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <button type="button" className="text-[11px] font-semibold text-muted underline-offset-2 hover:underline" onClick={() => setShowUrl((v) => !v)}>
        {showUrl ? "Hide image URL" : "Or paste an image URL"}
      </button>
      {showUrl ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or /uploads/…" />
      ) : null}
    </div>
  );
}

export function AdminProductImageGrid({
  images,
  pending,
  uploading,
  onUpload,
  onRemovePending,
  onDelete,
  onPrimary,
  onReorder,
  onAlt,
  children,
}: {
  images: Array<{ id: number; url: string; isPrimary?: boolean; alt?: string | null }>;
  pending?: Array<{ preview: string; name: string }>;
  uploading?: boolean;
  onUpload: (files: File[]) => void;
  onRemovePending?: (index: number) => void;
  onDelete?: (id: number) => void;
  onPrimary?: (id: number) => void;
  onReorder?: (from: number, to: number) => void;
  onAlt?: (id: number, alt: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-5">
      <p className="font-medium">Images</p>
      <p className="mt-1 text-xs text-muted">
        Add product photos from your computer. The first image is the shop card; the second is the hover image.
      </p>
      <div className="mt-4">
        <DropZone label="Add images" multiple busy={uploading} onFiles={onUpload} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={img.id} className="relative w-28">
            <img src={mediaUrl(img.url)} alt={img.alt ?? ""} className="h-28 w-28 rounded-lg object-cover" />
            {i === 0 ? <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-semibold">Card</span> : null}
            {i === 1 ? <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-semibold">Hover</span> : null}
            <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
              {onReorder ? (
                <>
                  <button type="button" onClick={() => onReorder(i, i - 1)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => onReorder(i, i + 1)}>
                    ↓
                  </button>
                </>
              ) : null}
              {onPrimary && !img.isPrimary ? (
                <button type="button" onClick={() => onPrimary(img.id)}>
                  Primary
                </button>
              ) : null}
              {onDelete ? (
                <button type="button" className="text-danger" onClick={() => onDelete(img.id)}>
                  Delete
                </button>
              ) : null}
            </div>
            {onAlt ? (
              <input
                className="mt-1 w-full rounded border border-line bg-surface px-1 py-0.5 text-[10px]"
                placeholder="Alt text"
                defaultValue={img.alt ?? ""}
                onBlur={(e) => {
                  const alt = e.target.value;
                  if (alt === (img.alt ?? "")) return;
                  onAlt(img.id, alt);
                }}
              />
            ) : null}
          </div>
        ))}
        {pending?.map((item, i) => (
          <div key={`${item.name}-${i}`} className="relative w-28">
            <img src={item.preview} alt="" className="h-28 w-28 rounded-lg object-cover" />
            <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-semibold">New</span>
            {onRemovePending ? (
              <button type="button" className="mt-1 text-[10px] text-danger" onClick={() => onRemovePending(i)}>
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {children}
      <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted">
        <Upload className="h-3 w-3" /> Uploads save to the product gallery
      </p>
    </div>
  );
}
