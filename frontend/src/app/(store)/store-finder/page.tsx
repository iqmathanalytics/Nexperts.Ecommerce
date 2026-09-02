import Link from "next/link";

export const metadata = { title: "Find a store" };

export default function StoreFinderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <p className="nexperts-mark text-[10px] text-muted">Nexperts</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Find a store</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Flagship and partner studios are opening soon. Shop online with cash on delivery and doorstep delivery — or
        WhatsApp us for a personal shopping appointment.
      </p>
      <div className="mt-10 space-y-6 rounded-[2rem] border border-line bg-surface p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Flagship studio</p>
          <p className="mt-1 text-sm text-muted">Personal styling by appointment · Complimentary alteration consult</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Coastal studio</p>
          <p className="mt-1 text-sm text-muted">Weekend fittings by request</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Coming soon</p>
          <p className="mt-1 text-sm text-muted">New styling lounge in planning</p>
        </div>
      </div>
      <Link href="/contact" className="mt-8 inline-flex text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
        Book an appointment
      </Link>
    </div>
  );
}
