import { ORDER_FLOW } from "@/lib/orders";
import { Badge } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function OrderStatusFlow({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
  }

  const current = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);

  return (
    <ol className="flex flex-wrap gap-2">
      {ORDER_FLOW.map((step, i) => (
        <li
          key={step}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            i < current && "bg-brand-soft text-ink font-semibold",
            i === current && "bg-ink text-white",
            i > current && "bg-background text-muted",
          )}
        >
          {i + 1}. {step.charAt(0) + step.slice(1).toLowerCase()}
        </li>
      ))}
    </ol>
  );
}
