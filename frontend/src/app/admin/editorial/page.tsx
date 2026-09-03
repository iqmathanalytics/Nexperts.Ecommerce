"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AdminPage, FormError } from "@/components/admin/AdminTable";
import { useToast } from "@/components/ui/toast";
import type { OfferItem, StorefrontEditorial } from "@/lib/editorial";

type EditorialForm = {
  homeHeadline: string;
  homeSubhead: string;
  womenHeadline: string;
  womenSubhead: string;
  menHeadline: string;
  menSubhead: string;
  tickerText: string;
  promoText: string;
  saleEndsAt: string;
  offers: OfferItem[];
};

function toForm(data: StorefrontEditorial): EditorialForm {
  return {
    homeHeadline: data.homeHeadline ?? "",
    homeSubhead: data.homeSubhead ?? "",
    womenHeadline: data.womenHeadline ?? "",
    womenSubhead: data.womenSubhead ?? "",
    menHeadline: data.menHeadline ?? "",
    menSubhead: data.menSubhead ?? "",
    tickerText: (data.ticker ?? []).join("\n"),
    promoText: (data.promoCodes ?? []).join("\n"),
    saleEndsAt: data.saleEndsAt ? data.saleEndsAt.slice(0, 16) : "",
    offers: (data.offers ?? []).map((o) => ({ ...o })),
  };
}

const emptyOffer = (): OfferItem => ({ kicker: "", code: "", text: "", href: "/sale" });

export default function EditorialAdminPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<EditorialForm | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-editorial"],
    queryFn: () => api<StorefrontEditorial>("/admin/editorial"),
  });

  useEffect(() => {
    if (data?.data) setForm(toForm(data.data));
  }, [data?.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("Nothing to save");
      const body = {
        homeHeadline: form.homeHeadline,
        homeSubhead: form.homeSubhead,
        womenHeadline: form.womenHeadline,
        womenSubhead: form.womenSubhead,
        menHeadline: form.menHeadline,
        menSubhead: form.menSubhead,
        ticker: form.tickerText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        promoCodes: form.promoText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        saleEndsAt: form.saleEndsAt ? new Date(form.saleEndsAt).toISOString() : "",
        offers: form.offers.filter((o) => o.code.trim() || o.text.trim()),
      };
      return api("/admin/editorial", { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-editorial"] });
      qc.invalidateQueries({ queryKey: ["editorial"] });
      toast.push("Editorial saved", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  if (isLoading || !form) {
    return (
      <AdminPage title="Editorial" description="Home campaigns, ticker, offers, and sale countdown.">
        <p className="text-sm text-muted">Loading editorial…</p>
      </AdminPage>
    );
  }

  if (isError) {
    return (
      <AdminPage title="Editorial" description="Home campaigns, ticker, offers, and sale countdown.">
        <p className="text-sm text-danger">Could not load editorial settings.</p>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Editorial"
      description="Controls home headlines, offer popups, ticker, promo strip, and the sale countdown end time."
      actions={
        <Button pending={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save editorial"}
        </Button>
      }
    >
      <FormError error={save.error} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-line bg-surface-raised p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Home</h2>
          <div>
            <Label>Headline</Label>
            <Textarea rows={3} value={form.homeHeadline} onChange={(e) => setForm({ ...form, homeHeadline: e.target.value })} />
          </div>
          <div>
            <Label>Subhead</Label>
            <Textarea rows={3} value={form.homeSubhead} onChange={(e) => setForm({ ...form, homeSubhead: e.target.value })} />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-surface-raised p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Hubs</h2>
          <div>
            <Label>Women headline</Label>
            <Input value={form.womenHeadline} onChange={(e) => setForm({ ...form, womenHeadline: e.target.value })} />
          </div>
          <div>
            <Label>Women subhead</Label>
            <Input value={form.womenSubhead} onChange={(e) => setForm({ ...form, womenSubhead: e.target.value })} />
          </div>
          <div>
            <Label>Men headline</Label>
            <Input value={form.menHeadline} onChange={(e) => setForm({ ...form, menHeadline: e.target.value })} />
          </div>
          <div>
            <Label>Men subhead</Label>
            <Input value={form.menSubhead} onChange={(e) => setForm({ ...form, menSubhead: e.target.value })} />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-surface-raised p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Ticker & promos</h2>
          <div>
            <Label>Ticker lines (one per line)</Label>
            <Textarea rows={6} value={form.tickerText} onChange={(e) => setForm({ ...form, tickerText: e.target.value })} />
          </div>
          <div>
            <Label>Promo strip lines (one per line)</Label>
            <Textarea rows={5} value={form.promoText} onChange={(e) => setForm({ ...form, promoText: e.target.value })} />
          </div>
          <div>
            <Label>Sale ends at</Label>
            <Input
              type="datetime-local"
              value={form.saleEndsAt}
              onChange={(e) => setForm({ ...form, saleEndsAt: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted">Powers the /sale countdown. Leave blank for a rolling 3-day timer.</p>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Offers</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setForm({ ...form, offers: [...form.offers, emptyOffer()] })}
            >
              Add offer
            </Button>
          </div>
          <div className="space-y-4">
            {form.offers.map((offer, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-2">
                <Input
                  placeholder="Kicker"
                  value={offer.kicker}
                  onChange={(e) => {
                    const offers = [...form.offers];
                    offers[idx] = { ...offer, kicker: e.target.value };
                    setForm({ ...form, offers });
                  }}
                />
                <Input
                  placeholder="CODE"
                  value={offer.code}
                  onChange={(e) => {
                    const offers = [...form.offers];
                    offers[idx] = { ...offer, code: e.target.value.toUpperCase() };
                    setForm({ ...form, offers });
                  }}
                />
                <Input
                  placeholder="Text"
                  value={offer.text}
                  onChange={(e) => {
                    const offers = [...form.offers];
                    offers[idx] = { ...offer, text: e.target.value };
                    setForm({ ...form, offers });
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="/sale"
                    value={offer.href}
                    onChange={(e) => {
                      const offers = [...form.offers];
                      offers[idx] = { ...offer, href: e.target.value };
                      setForm({ ...form, offers });
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForm({ ...form, offers: form.offers.filter((_, i) => i !== idx) })}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {!form.offers.length ? <p className="text-sm text-muted">No offers yet.</p> : null}
          </div>
        </section>
      </div>
    </AdminPage>
  );
}
