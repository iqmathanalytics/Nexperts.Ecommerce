export default function StoreLoading() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center gap-4 bg-background px-4 text-ink" role="status" aria-live="polite" aria-label="Loading">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-[var(--btn-fill-border)] opacity-40" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--btn-fill-text)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">Loading</p>
      <div className="mt-2 h-[3px] w-40 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/3 animate-[loading-slide_1.05s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,var(--accent),var(--brand),var(--accent),transparent)]" />
      </div>
    </div>
  );
}
