import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/store/StaticPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact us">
      <p>For order, shipping, or return questions, sign in and open your order from the account area.</p>
      <p>
        Email:{" "}
        <a href="mailto:support@nexperts.com" className="font-medium text-ink underline-offset-2 hover:underline">
          support@nexperts.com
        </a>
      </p>
      <p>Support hours: Monday–Saturday, 10:00–18:00. We aim to respond within one business day.</p>
      <p>
        Browse the <Link href="/products" className="font-medium text-ink underline-offset-2 hover:underline">shop</Link> or
        visit your <Link href="/account" className="font-medium text-ink underline-offset-2 hover:underline">account</Link> for
        self-service order tracking.
      </p>
    </StaticPage>
  );
}
