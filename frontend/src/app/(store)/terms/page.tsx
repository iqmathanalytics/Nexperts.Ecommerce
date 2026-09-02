import type { Metadata } from "next";
import { StaticPage } from "@/components/store/StaticPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service">
      <p>
        By using this store you agree to provide accurate account and shipping information, pay for orders placed,
        and comply with applicable laws.
      </p>
      <p>
        Product prices, availability, and descriptions may change without notice. We reserve the right to cancel orders
        affected by pricing errors, stock issues, or suspected fraud.
      </p>
      <p>
        Returns are accepted within 7 days for unused items in original packaging unless otherwise stated on the product
        page. Refunds for eligible returns are processed after inspection.
      </p>
      <p>
        Our liability is limited to the amount paid for the affected order. These terms are governed by applicable law.
      </p>
    </StaticPage>
  );
}
