export default function AdminLoading() {
  return (
    <div className="flex min-h-[50svh] flex-col items-center justify-center gap-3 text-ink" role="status" aria-live="polite" aria-label="Loading">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-line" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Loading</p>
    </div>
  );
}
