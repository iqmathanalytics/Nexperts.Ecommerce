"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
  const [lastCode, setLastCode] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["loyalty"],
    queryFn: () =>
      api<{ balance: number; transactions: Array<{ id: number; points: number; type: string; reason: string; createdAt: string }> }>(
        "/loyalty",
      ),
  });

  const redeem = useMutation({
    mutationFn: () =>
      api<{ discountAmount: number; couponCode: string; couponHint: string }>("/loyalty/redeem", {
        method: "POST",
        body: JSON.stringify({ points: Number(points) }),
      }),
    onSuccess: (res) => {
      const code = res.data?.couponCode || res.data?.couponHint;
      if (code) {
        setLastCode(code);
        try {
          sessionStorage.setItem("nx_loyalty_coupon", code);
        } catch {
          /* ignore */
        }
      }
      push(`Redeemed — use code ${code} at checkout for ${formatINR(res.data?.discountAmount ?? 0)} off`);
      qc.invalidateQueries({ queryKey: ["loyalty"] });
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (isError || !data?.data) return <PageState title="Sign in to view loyalty" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Rewards</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">Loyalty</h1>
      <div className="mt-8 border border-line bg-surface p-6">
        <LoyaltyBadge points={data.data.balance} />
        <p className="mt-4 text-sm text-muted">100 points = RM 10 off. Redeem to mint a one-time checkout code.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Input value={points} onChange={(e) => setPoints(e.target.value)} className="w-32" type="number" min={100} step={100} />
          <Button pending={redeem.isPending} onClick={() => redeem.mutate()}>
            {redeem.isPending ? "Redeeming…" : "Redeem points"}
          </Button>
        </div>
        {lastCode ? (
          <div className="mt-5 border border-line bg-background p-4 text-sm">
            <p className="font-medium">
              Your code: <span className="font-mono tracking-wide">{lastCode}</span>
            </p>
            <Link href="/checkout" className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
              Apply at checkout
            </Link>
          </div>
        ) : null}
      </div>
      <h2 className="mt-12 font-display text-2xl font-semibold">Activity</h2>
      <ul className="mt-4 divide-y divide-line border border-line bg-surface">
        {(data.data.transactions ?? []).map((t) => (
          <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{t.reason}</p>
              <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleDateString("en-MY")}</p>
            </div>
            <span className={t.type === "REDEEM" ? "text-danger" : "text-success"}>
              {t.type === "REDEEM" ? "−" : "+"}
              {Math.abs(t.points)}
            </span>
          </li>
        ))}
        {!data.data.transactions?.length ? <li className="px-4 py-6 text-sm text-muted">No activity yet — shop to earn points.</li> : null}
      </ul>
    </div>
  );
}
