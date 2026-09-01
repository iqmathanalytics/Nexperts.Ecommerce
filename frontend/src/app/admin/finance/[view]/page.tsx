import { notFound } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

const views: Record<string, { title: string; description?: string }> = {
  payments: { title: "Payments", description: "Review payment provider configuration and settlement status." },
  transactions: { title: "Transactions", description: "Browse payment transactions, refunds, and reconciliation data." },
  tax: { title: "Tax", description: "Configure tax rules and download tax summaries." },
  invoices: { title: "Invoices", description: "Generate and export customer invoices." },
};

export default async function FinanceViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = views[view];
  if (!config) notFound();
  return <AdminPlaceholder title={config.title} section="Finance" description={config.description} />;
}
