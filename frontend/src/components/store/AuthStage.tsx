"use client";

import Image from "next/image";
import { useState, type ComponentProps, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AuthStage({
  image,
  kicker,
  title,
  subtitle,
  children,
}: {
  image: string;
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative mx-auto grid min-h-[calc(100svh-8.75rem)] max-w-[1400px] overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      {/* Mobile brand band */}
      <div className="relative h-[38svh] min-h-[11.5rem] max-h-[18rem] overflow-hidden bg-brand lg:hidden">
        <Image src={image} alt="" fill priority quality={70} sizes="100vw" className="object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-white">
          <p className="nexperts-mark text-[10px] text-white/75">{kicker}</p>
          <p className="mt-2 max-w-xs font-display text-2xl font-semibold leading-tight">
            A house account for wherever you live — and everywhere you travel.
          </p>
        </div>
      </div>

      {/* Desktop hero panel */}
      <div className="relative hidden min-h-[78vh] bg-brand lg:block">
        <Image src={image} alt="" fill priority quality={70} sizes="50vw" className="object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/25 to-transparent" />
        <div className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full border border-white/15" aria-hidden />
        <div className="float-slow pointer-events-none absolute right-16 top-40 h-28 w-28 rounded-full border border-accent/40" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="nexperts-mark text-[10px] text-white/70">{kicker}</p>
          <p className="mt-3 max-w-sm font-display text-4xl font-semibold leading-tight">
            A house account for wherever you live — and everywhere you travel.
          </p>
        </div>
      </div>

      <div className="relative flex items-start bg-background px-5 pb-10 pt-7 md:px-10 lg:items-center lg:px-14 lg:py-12">
        <div className="relative mx-auto w-full max-w-md">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-muted lg:block">{kicker}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight lg:mt-3 lg:text-4xl xl:text-5xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted lg:mt-3">{subtitle}</p>
          <div className="mt-6 lg:mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PasswordField({
  registration,
  placeholder = "Password",
  autoComplete = "current-password",
  id,
}: {
  registration: UseFormRegisterReturn;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 rounded-2xl bg-surface pr-12"
        {...registration}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn("h-12 rounded-2xl bg-surface", className)} {...props} />;
}
