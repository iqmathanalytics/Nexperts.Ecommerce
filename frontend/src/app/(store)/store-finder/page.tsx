import Link from "next/link";

export const metadata = { title: "Find a store" };

export default function StoreFinderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <p className="nexperts-mark text-[10px] text-muted">Nexperts</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Find a store</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Flagship and partner boutiques are expanding across India. Shop online with COD and doorstep delivery meanwhile —
        or WhatsApp us for personal shopping appointments.
      </p>
      <div className="mt-10 space-y-4 border border-line p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Mumbai — Coming soon</p>
          <p className="mt-1 text-sm text-muted">Bandra West personal shopping by appointment</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Delhi NCR — Coming soon</p>
          <p className="mt-1 text-sm text-muted">Saket studio fittings</p>
        </div>
      </div>
      <Link href="/contact" className="mt-8 inline-flex text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
        Book an appointment
      </Link>
    </div>
  );
}
