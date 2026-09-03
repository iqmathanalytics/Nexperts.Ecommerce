import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "btn-store inline-flex items-center justify-center gap-2 rounded-sm text-sm font-semibold tracking-wide disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
  {
    variants: {
      variant: {
        /** Soft sage fill + dark label — lighter and easier to read than black pills. */
        default: "btn-fill",
        brand: "btn-fill",
        outline: "border border-line bg-transparent text-[var(--btn-fill-text)] hover:border-[var(--btn-fill-border)] hover:bg-[var(--btn-fill)]",
        ghost: "bg-transparent text-[var(--btn-fill-text)] hover:bg-[var(--btn-fill)]",
        danger: "border border-danger/30 bg-[#f8e8e9] text-[#8a1c24] hover:bg-[#f3d6d8]",
        secondary: "border border-line bg-surface-muted text-[var(--btn-fill-text)] hover:bg-[var(--btn-fill)]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  pending = false,
  disabled,
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Instant busy look without waiting on the network — prefer this over only `disabled`. */
    pending?: boolean;
  }) {
  const isBusy = Boolean(pending);
  return (
    <button
      type={type}
      aria-busy={isBusy || undefined}
      data-pending={isBusy ? "true" : undefined}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), isBusy && "btn-pending", className)}
      {...props}
      onClick={(e) => {
        if (isBusy || disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {isBusy ? <span className="btn-spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
