import type { ReactNode } from "react";
import { Spinner, PageState, FieldError } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/toast";

export { Spinner, PageState, FieldError, Toast };
export { PageLoader, GlobalLoading } from "@/components/ui/GlobalLoading";
export {
  Skeleton,
  ProductCardSkeleton,
  Breadcrumbs,
  Swatch,
  QuantitySpinner,
  StarRating,
  LoyaltyBadge,
  FitFeedbackChip,
} from "@/components/ui/primitives";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <PageState title={title}>{children}</PageState>;
}
