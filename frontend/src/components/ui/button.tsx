import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "btn-store inline-flex items-center justify-center gap-2 rounded-sm text-sm font-semibold tracking-wide disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
  {
    variants: {
      variant: {
        /** Fixed near-black / white — stays readable even if theme tokens flip. */
        default: "bg-[#1c1915] text-white hover:bg-[#2a2620]",
        brand: "bg-[#1e3d32] text-white hover:bg-[#142820]",
        outline: "border border-line bg-transparent text-[#1c1915] hover:border-[#1c1915] hover:bg-surface-muted",
        ghost: "bg-transparent text-[#1c1915] hover:bg-surface-muted",
        danger: "bg-danger text-white hover:opacity-90",
        secondary: "bg-surface-muted text-[#1c1915] hover:bg-line",
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
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
