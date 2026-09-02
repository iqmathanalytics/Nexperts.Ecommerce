"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoyaltyBadge, PageState, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import { formatINR } from "@/lib/utils";

export default function LoyaltyPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [points, setPoints] = useState("100");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["loyalty"],
    queryFn: () =>
      api<{ balance: number; transactions: Array<{ id: number; points: number; type: string; reason: string; createdAt: string }> }>(
        "/loyalty",
      ),
  });

  const redeem = useMutation({
    mutationFn: () => api("/loyalty/redeem", { method: "POST", body: JSON.stringify({ points: Number(points) }) }),
    onSuccess: (res) => {
      push(`Redeemed — ${formatINR((res.data as { discountAmount?: number }).discountAmount ?? Number(points) / 10)} off unlocked`);
      qc.invalidateQueries({ queryKey: ["loyalty"] });
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-12"><Skeleton className="h-40 w-full" /></div>;
  if (isError || !data?.data) return <PageState title="Sign in to view loyalty" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Rewards</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">Loyalty</h1>
      <div className="mt-8 border border-line bg-surface p-6">
        <LoyaltyBadge points={data.data.balance} />
        <p className="mt-4 text-sm text-muted">100 points = ₹10 off. Redeem at checkout after generating a reward.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Input value={points} onChange={(e) => setPoints(e.target.value)} className="w-32" type="number" min={100} step={100} />
          <Button disabled={redeem.isPending} onClick={() => redeem.mutate()}>
            Redeem points
          </Button>
        </div>
      </div>
      <h2 className="mt-12 font-display text-2xl font-semibold">Activity</h2>
      <ul className="mt-4 divide-y divide-line border border-line bg-surface">
        {(data.data.transactions ?? []).map((t) => (
          <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{t.reason}</p>
              <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <span className={t.type === "REDEEM" ? "text-danger" : "text-success"}>
              {t.type === "REDEEM" ? "−" : "+"}
              {t.points}
            </span>
          </li>
        ))}
        {!data.data.transactions?.length ? <li className="px-4 py-6 text-sm text-muted">No activity yet — shop to earn points.</li> : null}
      </ul>
    </div>
  );
}
