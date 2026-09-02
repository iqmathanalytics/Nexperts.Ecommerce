"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const FAQS = [
  { q: "How do I find my size?", a: "Use the size guide on each product page. Complete the style quiz for a personalized fit profile." },
  { q: "What is your return policy?", a: "7-day returns on unused items with tags attached. Start a return from your order page." },
  { q: "Do you ship COD?", a: "Yes — cash on delivery is available across India, plus online payment via Razorpay where enabled." },
  { q: "How long does shipping take?", a: "Most orders arrive in 2–5 business days depending on warehouse proximity." },
];

export default function FaqPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await api<{ answer: string }>("/support/faq-chat", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setAnswer(res.data.answer);
    } catch {
      // Local heuristic fallback
      const hit = FAQS.find((f) => question.toLowerCase().includes(f.q.toLowerCase().slice(0, 12).toLowerCase()) || f.a.toLowerCase().includes(question.toLowerCase().slice(0, 8)));
      setAnswer(hit?.a ?? "For size and fit questions, open the size guide on the product page or WhatsApp support from the footer.");
      push("Answered from FAQ knowledge", "info");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Support</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">FAQ</h1>

      <div className="mt-10 space-y-4">
        {FAQS.map((f) => (
          <details key={f.q} className="border border-line bg-surface p-5">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 border border-line bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold">Ask about size & fit</h2>
        <p className="mt-2 text-sm text-muted">Lightweight FAQ assistant for common questions.</p>
        <Textarea className="mt-4" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Does this run small?" />
        <Button className="mt-3" disabled={loading} onClick={ask}>
          {loading ? "Thinking…" : "Ask"}
        </Button>
        {answer ? <p className="mt-4 text-sm leading-relaxed text-ink">{answer}</p> : null}
      </div>
    </div>
  );
}
