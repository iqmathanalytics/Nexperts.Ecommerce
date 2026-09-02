"use client";

export function AmbientScene({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,var(--background)_78%)]" />
    </div>
  );
}
