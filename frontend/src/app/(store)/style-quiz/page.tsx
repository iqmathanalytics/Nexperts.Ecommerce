"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  {
    id: "occasion",
    label: "Where do you dress most often?",
    options: ["Work", "Festive", "Everyday", "Evening"],
  },
  {
    id: "palette",
    label: "Your preferred palette?",
    options: ["Neutrals", "Earth tones", "Jewel tones", "Pastels"],
  },
  {
    id: "fit",
    label: "Preferred fit?",
    options: ["Slim", "Regular", "Oversized"],
  },
  {
    id: "size",
    label: "Usual size?",
    options: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "length",
    label: "Length preference?",
    options: ["As sized", "+2 cm longer", "Slightly cropped"],
  },
];

export default function StyleQuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { push } = useToast();
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const q = QUESTIONS[step];

  const save = useMutation({
    mutationFn: () =>
      api("/style-quiz", {
        method: "POST",
        body: JSON.stringify({
          quizAnswers: answers,
          preferredSize: answers.size ?? "M",
          fitPreference: (answers.fit ?? "Regular").toLowerCase(),
          lengthDeltaCm: answers.length?.includes("+2") ? 2 : answers.length?.includes("cropped") ? -2 : 0,
        }),
      }),
    onSuccess: () => {
      push("Style preferences saved");
      router.push("/products");
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  function choose(option: string) {
    const next = { ...answers, [q.id]: option };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    if (!isAuthenticated) {
      router.push(loginUrl("/style-quiz"));
      return;
    }
    save.mutate();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-16 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
        Step {step + 1} / {QUESTIONS.length}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">{q.label}</h1>
      <div className="mt-10 grid gap-3">
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => choose(opt)}
            className="border border-line px-5 py-4 text-left text-sm font-medium transition hover:border-ink hover:bg-surface"
          >
            {opt}
          </button>
        ))}
      </div>
      {step > 0 ? (
        <Button variant="ghost" className="mt-8 self-start" onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
      ) : (
        <Link href="/products" className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-ink">
          Skip for now
        </Link>
      )}
    </div>
  );
}
