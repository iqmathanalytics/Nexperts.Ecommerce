"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

export type ReviewEligible = {
  orderId: number;
  orderNumber: string;
  productId: number;
  productName: string;
  productSlug: string | null;
};

type ReviewFormProps = {
  eligible: ReviewEligible[];
  productId?: number;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function ReviewForm({ eligible, productId, onSuccess, onError }: ReviewFormProps) {
  const qc = useQueryClient();
  const defaultOrderId = eligible.length === 1 ? eligible[0]!.orderId : 0;
  const form = useForm({
    defaultValues: {
      orderId: defaultOrderId,
      productId: productId ?? 0,
      rating: 5,
      title: "",
      comment: "",
      fitFeedback: "TRUE" as "SMALL" | "TRUE" | "LARGE",
    },
  });
  const selectedOrderId = Number(form.watch("orderId"));
  const orderItems = productId
    ? eligible.filter((e) => e.productId === productId)
    : eligible.filter((e) => e.orderId === selectedOrderId);

  useEffect(() => {
    if (productId) form.setValue("productId", productId);
    if (productId && eligible.length === 1) form.setValue("orderId", eligible[0]!.orderId);
  }, [eligible, form, productId]);

  const submit = useMutation({
    mutationFn: (body: {
      productId: number;
      orderId: number;
      rating: number;
      title: string;
      comment: string;
      fitFeedback?: "SMALL" | "TRUE" | "LARGE";
    }) => api("/reviews", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
      qc.invalidateQueries({ queryKey: ["review-eligible"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      form.reset({ orderId: 0, productId: productId ?? 0, rating: 5, title: "", comment: "", fitFeedback: "TRUE" });
      onSuccess?.("Review accepted. Thank you — it is live on the product page.");
    },
    onError: (e: Error) => onError?.(e.message),
  });

  if (!eligible.length) {
    return (
      <p className="text-sm text-muted">
        You can review products from your orders. Only purchased items can be reviewed.
      </p>
    );
  }

  return (
    <form
      className="grid max-w-lg gap-3 rounded-xl border border-line bg-white p-4"
      onSubmit={form.handleSubmit((v) => {
        const orderId = productId && eligible.length === 1 ? eligible[0]!.orderId : Number(v.orderId);
        const pid = productId ?? Number(v.productId);
        if (!orderId || !pid) {
          onError?.("Select your delivered order and product.");
          return;
        }
        submit.mutate({
          productId: pid,
          orderId,
          rating: Number(v.rating),
          title: v.title,
          comment: v.comment,
          fitFeedback: v.fitFeedback,
        });
      })}
    >
      <p className="text-sm text-muted">Verified purchase review</p>
      {!productId ? (
        <>
          <Select {...form.register("orderId", { valueAsNumber: true })}>
            <option value={0}>Select delivered order</option>
            {[...new Map(eligible.map((e) => [e.orderId, e])).values()].map((e) => (
              <option key={e.orderId} value={e.orderId}>
                {e.orderNumber}
              </option>
            ))}
          </Select>
          <Select {...form.register("productId", { valueAsNumber: true })}>
            <option value={0}>Select purchased product</option>
            {orderItems.map((e) => (
              <option key={`${e.orderId}-${e.productId}`} value={e.productId}>
                {e.productName}
              </option>
            ))}
          </Select>
        </>
      ) : eligible.length > 1 ? (
        <Select {...form.register("orderId", { valueAsNumber: true })}>
          <option value={0}>Select order for this product</option>
          {eligible.map((e) => (
            <option key={e.orderId} value={e.orderId}>
              {e.orderNumber}
            </option>
          ))}
        </Select>
      ) : eligible.length === 1 ? (
        <p className="text-sm text-muted">Order: {eligible[0]!.orderNumber}</p>
      ) : null}
      <Select {...form.register("rating", { valueAsNumber: true })}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} stars
          </option>
        ))}
      </Select>
      <Select {...form.register("fitFeedback")}>
        <option value="TRUE">True to size</option>
        <option value="SMALL">Runs small</option>
        <option value="LARGE">Runs large</option>
      </Select>
      <Input placeholder="Review title" {...form.register("title", { required: true, minLength: 3 })} />
      <Textarea placeholder="Share your experience (min 10 characters)" {...form.register("comment", { required: true, minLength: 10 })} />
      <Button type="submit" disabled={submit.isPending}>{submit.isPending ? "Submitting…" : "Submit review"}</Button>
    </form>
  );
}
