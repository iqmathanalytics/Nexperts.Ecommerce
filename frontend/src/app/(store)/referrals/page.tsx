"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageState, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";

export default function ReferralsPage() {
  const { push } = useToast();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const mine = useQuery({
    queryKey: ["referrals-me"],
    queryFn: () => api<{ code: string; rewardAmount: number; status: string }>("/referrals/me"),
  });
  const claim = useMutation({
    mutationFn: () => api("/referrals/claim", { method: "POST", body: JSON.stringify({ code }) }),
    onSuccess: () => {
      push("Referral applied — ₹20 credit coming your way");
      qc.invalidateQueries({ queryKey: ["loyalty"] });
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  if (mine.isLoading) return <div className="mx-auto max-w-xl px-4 py-12"><Skeleton className="h-32 w-full" /></div>;
  if (mine.isError) return <PageState title="Sign in to share referrals" />;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${mine.data?.data.code}` : "";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Referrals</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">Give ₹20, get ₹20</h1>
      <p className="mt-3 text-sm text-muted">Share your code. When a friend places their first order, you both earn credit.</p>

      <div className="mt-8 border border-line bg-surface p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Your code</p>
        <p className="mt-2 font-display text-3xl font-semibold tracking-wide">{mine.data?.data.code}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl || mine.data!.data.code);
            push("Copied");
          }}
        >
          Copy invite link
        </Button>
      </div>

      <div className="mt-8 border border-line bg-surface p-6">
        <p className="text-sm font-medium">Have a code?</p>
        <div className="mt-3 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FRIEND20" />
          <Button disabled={!code || claim.isPending} onClick={() => claim.mutate()}>
            Claim
          </Button>
        </div>
      </div>
    </div>
  );
}
