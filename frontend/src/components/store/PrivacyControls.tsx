"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/hooks/useSession";

export function PrivacyControls() {
  const { isAuthenticated } = useSession();
  const { push } = useToast();
  const exportData = useMutation({
    mutationFn: () => api("/privacy/export"),
    onSuccess: (res) => {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nexperts-data-export.json";
      a.click();
      push("Export downloaded");
    },
    onError: (e: Error) => push(e.message, "error"),
  });
  const del = useMutation({
    mutationFn: () => api("/privacy/delete", { method: "POST", body: "{}" }),
    onSuccess: () => push("Account deletion requested"),
    onError: (e: Error) => push(e.message, "error"),
  });
  const consent = useMutation({
    mutationFn: (granted: boolean) =>
      api("/privacy/consent", { method: "POST", body: JSON.stringify({ type: "marketing", granted }) }),
    onSuccess: () => push("Consent saved"),
    onError: (e: Error) => push(e.message, "error"),
  });

  if (!isAuthenticated) return null;

  return (
    <div className="mt-10 border border-line bg-surface p-6">
      <h2 className="font-display text-2xl font-semibold">Your data rights</h2>
      <p className="mt-2 text-sm text-muted">Export or delete your account data (GDPR).</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" disabled={exportData.isPending} onClick={() => exportData.mutate()}>
          Export my data
        </Button>
        <Button variant="outline" disabled={consent.isPending} onClick={() => consent.mutate(true)}>
          Allow marketing
        </Button>
        <Button variant="danger" disabled={del.isPending} onClick={() => del.mutate()}>
          Delete account
        </Button>
      </div>
    </div>
  );
}
