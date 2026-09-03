/** Quiet wait while the next store route paints — not a full-screen brand gate. */
export default function StoreLoading() {
  return <div className="min-h-[30svh] bg-background" aria-hidden />;
}
